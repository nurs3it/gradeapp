from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import UserRole, Role
from schools.models import School, SchoolType

User = get_user_model()


class UserModelTest(TestCase):
    def setUp(self):
        self.school = School.objects.create(
            name='Test School',
            type=SchoolType.NIS,
            city='Almaty'
        )
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

    def test_user_creation(self):
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertTrue(self.user.check_password('testpass123'))
        self.assertEqual(self.user.get_full_name(), 'Test User')

    def test_user_role(self):
        UserRole.objects.create(
            user=self.user,
            school=self.school,
            role=Role.TEACHER
        )
        self.assertTrue(self.user.has_role(Role.TEACHER))
        self.assertFalse(self.user.has_role(Role.STUDENT))

