'use client';

import { useState, useEffect } from 'react';
import { Check, Zap, Crown, Rocket, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const router = useRouter();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/billing/plans');
      const result = await response.json();

      if (result.success) {
        setPlans(result.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load pricing plans');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeRequest = async (planId) => {
    // For now, show a message to contact support
    toast.success('Upgrade request submitted! Our team will contact you shortly.');
    // In future, this will integrate with payment processing
  };

  const getPlanIcon = (planId) => {
    const icons = {
      free: Zap,
      starter: Star,
      professional: Rocket,
      business: Crown,
      enterprise: Crown,
    };
    return icons[planId] || Zap;
  };

  const getPlanColor = (planId) => {
    const colors = {
      free: 'border-gray-300 dark:border-gray-700',
      starter: 'border-blue-300 dark:border-blue-700',
      professional: 'border-purple-300 dark:border-purple-700',
      business: 'border-orange-300 dark:border-orange-700',
      enterprise: 'border-yellow-300 dark:border-yellow-700',
    };
    return colors[planId] || 'border-gray-300';
  };

  const formatStorage = (bytes) => {
    if (bytes === 0) return '0 MB';
    const gb = bytes / (1024 * 1024 * 1024);
    const mb = bytes / (1024 * 1024);
    return gb >= 1 ? `${gb} GB` : `${mb} MB`;
  };

  const formatBandwidth = (bytes) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1 ? `${gb} GB` : `${bytes / (1024 * 1024)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8 md:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
            Choose the perfect plan for your team. Upgrade or downgrade at any time.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-3 md:gap-4 mt-6 md:mt-8">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all relative text-sm md:text-base ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-8 md:mb-12">
          {plans.map((plan) => {
            const Icon = getPlanIcon(plan.id);
            const isPopular = plan.id === 'professional';
            const price =
              billingCycle === 'annual' && plan.price > 0
                ? Math.round(plan.price * 12 * 0.8)
                : plan.price;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden hover:shadow-xl transition-shadow border-2 ${getPlanColor(
                  plan.id
                )} ${isPopular ? 'scale-105 md:scale-110 shadow-lg' : ''}`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 text-xs font-bold">
                    POPULAR
                  </div>
                )}

                <div className="p-4 md:p-6">
                  {/* Plan Header */}
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <Icon className="w-6 h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-xl md:text-2xl font-bold capitalize">
                      {plan.name}
                    </h3>
                  </div>

                  {/* Price */}
                  <div className="mb-4 md:mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl md:text-4xl lg:text-5xl font-bold">
                        ${price}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
                          /{billingCycle === 'annual' ? 'year' : 'month'}
                        </span>
                      )}
                    </div>
                    {billingCycle === 'annual' && plan.price > 0 && (
                      <p className="text-xs md:text-sm text-green-600 dark:text-green-400 mt-1">
                        Save ${plan.price * 12 - price} per year
                      </p>
                    )}
                  </div>

                  {/* Storage & Bandwidth */}
                  <div className="space-y-2 mb-4 md:mb-6 text-xs md:text-sm">
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-gray-600 dark:text-gray-400">
                        Storage
                      </span>
                      <span className="font-semibold">
                        {formatStorage(plan.storage)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-gray-600 dark:text-gray-400">
                        Bandwidth
                      </span>
                      <span className="font-semibold">
                        {formatBandwidth(plan.bandwidth)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-gray-600 dark:text-gray-400">
                        Uploads
                      </span>
                      <span className="font-semibold">
                        {plan.uploadsPerMonth === 0
                          ? '0'
                          : plan.uploadsPerMonth.toLocaleString()}
                        /mo
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-gray-600 dark:text-gray-400">
                        Max File
                      </span>
                      <span className="font-semibold">
                        {plan.maxFileSize / (1024 * 1024)} MB
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleUpgradeRequest(plan.id)}
                    disabled={plan.id === 'free'}
                    className={`w-full text-sm md:text-base ${
                      isPopular
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                        : ''
                    }`}
                    variant={plan.id === 'free' ? 'outline' : 'default'}
                  >
                    {plan.id === 'free'
                      ? 'Current Plan'
                      : plan.id === 'enterprise'
                      ? 'Contact Sales'
                      : 'Get Started'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-12 md:mt-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4 md:space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
              <h3 className="font-semibold mb-2 text-base md:text-lg">
                How does billing work?
              </h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                For now, we process payments manually. After selecting a plan,
                our team will contact you for payment processing. We're working
                on automated billing for a smoother experience.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
              <h3 className="font-semibold mb-2 text-base md:text-lg">
                Can I change plans later?
              </h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                take effect immediately, and we'll prorate your billing
                accordingly.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
              <h3 className="font-semibold mb-2 text-base md:text-lg">
                What happens if I exceed my limits?
              </h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                You'll receive notifications when approaching your limits. Once
                exceeded, uploads will be blocked until the next billing cycle or
                you can upgrade to a higher plan immediately.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
              <h3 className="font-semibold mb-2 text-base md:text-lg">
                Is there a free trial?
              </h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                The Free plan is available indefinitely with limited features. For
                paid plans, contact us for a trial period discussion.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
              <h3 className="font-semibold mb-2 text-base md:text-lg">
                Do you offer custom enterprise plans?
              </h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Yes! Enterprise plans can be customized to your specific needs
                with dedicated support, SLA guarantees, and custom integrations.
                Contact our sales team to discuss your requirements.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12 md:mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl md:rounded-2xl p-6 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
            Ready to get started?
          </h2>
          <p className="text-base md:text-lg mb-6 md:mb-8 opacity-90">
            Join teams already using TestForge to streamline their testing workflow
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100 text-sm md:text-base"
              onClick={() => router.push('/signup')}
            >
              Start Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 text-sm md:text-base"
              onClick={() => handleUpgradeRequest('professional')}
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
