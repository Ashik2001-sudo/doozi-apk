import { useRouter, usePathname, useLocalSearchParams } from 'expo-router';

export function useAppRouter() {
  const router = useRouter();
  return {
    push: (href: string) => router.push(href as never),
    replace: (href: string) => router.replace(href as never),
    back: () => router.back(),
    pathname: usePathname(),
  };
}

export { useLocalSearchParams, usePathname, useRouter };
