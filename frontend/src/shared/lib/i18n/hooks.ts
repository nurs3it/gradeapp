import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { Namespace, loadResource, languages } from './config'

/**
 * Hook for translations with namespace support
 * Ensures namespace is loaded before using translations (lazy loading)
 * Returns ready state to prevent showing translation keys
 */
export function useTranslationWithNamespace(namespace: Namespace) {
  const { t: _t, i18n, ready } = useTranslation(namespace)
  const [isNamespaceReady, setIsNamespaceReady] = useState(false)

  useEffect(() => {
    const loadNamespace = async () => {
      const currentLanguage = (i18n.language || languages.ru) as typeof languages[keyof typeof languages]
      
      // Always reload when language changes to ensure fresh translations
      const resource = await loadResource(currentLanguage, namespace)
      i18n.addResourceBundle(currentLanguage, namespace, resource, true, true)
      setIsNamespaceReady(true)
    }

    // Reset ready state when language changes
    setIsNamespaceReady(false)
    loadNamespace()
  }, [i18n, namespace, i18n.language])

  return {
    t: (key: string, options?: Record<string, unknown>) => {
      // Extract namespace from options if provided, otherwise use hook namespace
      const targetNamespace = (options?.ns as string) || namespace
      
      // Always use i18n.t() which handles formatting correctly
      // It will use cached translations or load them if needed
      const result = i18n.t(key, {
        ...options,
        ns: targetNamespace,
        defaultValue: options?.defaultValue as string,
      })
      
      // If result is key and we have defaultValue, use it
      if (result === key && options?.defaultValue) {
        return options.defaultValue as string
      }
      
      return result
    },
    i18n,
    ready: ready && isNamespaceReady,
  }
}

/**
 * Hook for multiple namespaces
 * Ensures all namespaces are loaded before using translations (lazy loading)
 * Returns ready state to prevent showing translation keys
 */
export function useTranslationWithNamespaces(namespaceList: Namespace[]) {
  const { t: _t, i18n, ready } = useTranslation(namespaceList)
  const [areNamespacesReady, setAreNamespacesReady] = useState(false)

  useEffect(() => {
    const loadNamespaces = async () => {
      const currentLanguage = (i18n.language || languages.ru) as typeof languages[keyof typeof languages]
      
      // Always reload when language changes to ensure fresh translations
      const loadPromises = namespaceList.map(async (ns) => {
        const resource = await loadResource(currentLanguage, ns)
        i18n.addResourceBundle(currentLanguage, ns, resource, true, true)
      })

      await Promise.all(loadPromises)
      setAreNamespacesReady(true)
    }

    // Reset ready state when language changes
    setAreNamespacesReady(false)
    loadNamespaces()
  }, [i18n, namespaceList, i18n.language])

  return {
    t: (key: string, options?: Record<string, unknown>) => {
      // Extract namespace from options if provided
      const targetNamespace = (options?.ns as string)
      
      // Use i18n.t() which handles all namespaces and formatting correctly
      // If specific namespace requested, use it, otherwise i18n will search in all namespaces
      const result = i18n.t(key, {
        ...options,
        ns: targetNamespace || namespaceList,
        defaultValue: options?.defaultValue as string,
      })
      
      // If result is key and we have defaultValue, use it
      if (result === key && options?.defaultValue) {
        return options.defaultValue as string
      }
      
      return result
    },
    i18n,
    ready: ready && areNamespacesReady,
  }
}

