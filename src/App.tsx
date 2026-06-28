import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import { initAnalytics } from "./lib/analytics";

// Lazy-load non-critical routes to keep initial bundle small & fast
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminChat = lazy(() => import("./pages/AdminChat"));
const PrepResultsPage = lazy(() => import("./pages/PrepResultsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AboutPage = lazy(() => import("./pages/StaticPage").then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import("./pages/StaticPage").then(m => ({ default: m.ContactPage })));
const PrivacyPage = lazy(() => import("./pages/StaticPage").then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("./pages/StaticPage").then(m => ({ default: m.TermsPage })));
const CookiesPage = lazy(() => import("./pages/StaticPage").then(m => ({ default: m.CookiesPage })));
const EditorialPolicyPage = lazy(() => import("./pages/StaticPage").then(m => ({ default: m.EditorialPolicyPage })));
const CorrectionsPolicyPage = lazy(() => import("./pages/StaticPage").then(m => ({ default: m.CorrectionsPolicyPage })));
const OwnershipPage = lazy(() => import("./pages/StaticPage").then(m => ({ default: m.OwnershipPage })));
const CollectionPage = lazy(() => import("./pages/CollectionPage"));
const HtmlSitemapPage = lazy(() => import("./pages/HtmlSitemapPage"));


// Lazy-load non-critical UI shells
const FloatingWhatsApp = lazy(() => import("./components/FloatingWhatsApp"));
const StickyAdTowers = lazy(() => import("./components/StickyAdTowers"));
const MobileBottomNav = lazy(() => import("./components/MobileBottomNav"));
const MandatoryOnboarding = lazy(() => import("./components/MandatoryOnboarding"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground text-sm">
    جاري التحميل...
  </div>
);

const App = () => {
  useEffect(() => { initAnalytics(); }, []);
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={null}>
          <StickyAdTowers />
        </Suspense>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/article/:id" element={<ArticlePage />} />
            <Route path="/latest" element={<CollectionPage mode="latest" />} />
            <Route path="/breaking" element={<CollectionPage mode="breaking" />} />
            <Route path="/most-read" element={<CollectionPage mode="most-read" />} />
            <Route path="/most-viewed" element={<CollectionPage mode="most-read" />} />
            <Route path="/tag/:slug" element={<CollectionPage mode="tag" />} />
            <Route path="/governorate/:slug" element={<CollectionPage mode="governorate" />} />
            <Route path="/entity/:slug" element={<CollectionPage mode="entity" />} />
            <Route path="/archive/:yyyy" element={<CollectionPage mode="archive" />} />
            <Route path="/archive/:yyyy/:mm" element={<CollectionPage mode="archive" />} />
            <Route path="/archive/:yyyy/:mm/:dd" element={<CollectionPage mode="archive" />} />
            <Route path="/search" element={<CollectionPage mode="search" />} />
            <Route path="/sitemap" element={<HtmlSitemapPage />} />

            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/chat" element={<AdminChat />} />
            <Route path="/results/prep" element={<PrepResultsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/privacy-policy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/cookies" element={<CookiesPage />} />
            <Route path="/editorial-policy" element={<EditorialPolicyPage />} />
            <Route path="/corrections" element={<CorrectionsPolicyPage />} />
            <Route path="/ownership" element={<OwnershipPage />} />
            <Route path="/:id" element={<ArticlePage />} />
            <Route path="*" element={<NotFound />} />

          </Routes>
        </Suspense>
        <Suspense fallback={null}>
          <FloatingWhatsApp />
          <MobileBottomNav />
          <MandatoryOnboarding />
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
