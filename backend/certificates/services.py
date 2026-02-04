"""
PDF certificate generation service using WeasyPrint.
"""
import os
from django.conf import settings
from django.template import Template, Context
from django.core.files.base import ContentFile
from .models import Certificate, CertificateTemplate
from i18n_integration.services import get_translation


def generate_certificate_pdf(certificate: Certificate, template: CertificateTemplate = None) -> str:
    """
    Generate PDF certificate from template.
    
    Args:
        certificate: Certificate instance
        template: CertificateTemplate instance (optional)
    
    Returns:
        Path to generated PDF file
    """
    # Lazy import WeasyPrint to avoid issues if libraries are missing
    try:
        from weasyprint import HTML, CSS
        from weasyprint.text.fonts import FontConfiguration
    except ImportError:
        raise ImportError("WeasyPrint is not properly installed. Please install system dependencies.")
    
    if not template:
        # Try to get default template for school
        template = CertificateTemplate.objects.filter(
            school=certificate.student.school,
            is_active=True
        ).first()
    
    if not template:
        raise ValueError("No certificate template found")
    
    # Get localized template content
    html_content = template.html_template
    language = certificate.language or 'ru'
    
    # Replace placeholders with actual data
    context = {
        'student_name': certificate.student.user.get_full_name(),
        'student_number': certificate.student.student_number,
        'title': get_translation(certificate.title, language),
        'issue_date': certificate.issue_date.strftime('%d.%m.%Y'),
        'school_name': certificate.student.school.name,
        **certificate.meta
    }
    
    # Replace placeholders in template
    template_obj = Template(html_content)
    context_obj = Context(context)
    rendered_html = template_obj.render(context_obj)
    
    # Generate PDF
    font_config = FontConfiguration()
    html_doc = HTML(string=rendered_html)
    
    # Add basic styling
    css = CSS(string='''
        @page {
            size: A4 landscape;
            margin: 2cm;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
        }
    ''')
    
    pdf_bytes = html_doc.write_pdf(stylesheets=[css], font_config=font_config)
    
    # Save PDF to file
    filename = f"certificate_{certificate.id}.pdf"
    filepath = os.path.join(settings.MEDIA_ROOT, 'certificates', filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    with open(filepath, 'wb') as f:
        f.write(pdf_bytes)
    
    # Update certificate with file path
    certificate.pdf_file.name = f'certificates/{filename}'
    certificate.pdf_url = f"{settings.MEDIA_URL}certificates/{filename}"
    certificate.save()
    
    return filepath

