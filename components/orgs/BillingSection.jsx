'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  HardDrive,
  TrendingUp,
  Upload,
  CreditCard,
  AlertCircle,
  CheckCircle,
  ArrowUpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function BillingSection({ orgId }) {
  const [billing, setBilling] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (orgId) {
      fetchBillingInfo();
      fetchUsageStats();
    }
  }, [orgId]);

  const fetchBillingInfo = async () => {
    try {
      const response = await fetch(`/api/billing/organizations/${orgId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setBilling(result.data);
      }
    } catch (error) {
      console.error('Error fetching billing:', error);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const response = await fetch(
        `/api/billing/organizations/${orgId}/usage`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setUsage(result.data);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestUpgrade = async () => {
    router.push('/pricing');
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600 dark:text-red-400';
    if (percentage >= 75) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!billing || !usage) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Unable to load billing information</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Current Plan Card */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">
              Current Plan
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl font-bold capitalize bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {usage.plan}
              </span>
              {billing.status === 'active' ? (
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
              )}
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Status: <span className="font-medium capitalize">{billing.status}</span>
            </p>
          </div>

          <Button
            onClick={requestUpgrade}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm md:text-base w-full sm:w-auto"
          >
            <ArrowUpCircle className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        </div>

        {/* Usage Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Storage */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                <span className="text-xs md:text-sm font-medium">Storage</span>
              </div>
              <span
                className={`text-xs md:text-sm font-bold ${getStatusColor(
                  usage.storage.percentage
                )}`}
              >
                {Math.round(usage.storage.percentage)}%
              </span>
            </div>

            <div className="mb-2">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(
                    usage.storage.percentage
                  )} transition-all`}
                  style={{ width: `${Math.min(usage.storage.percentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{formatBytes(usage.storage.used)}</span>
              <span>{formatBytes(usage.storage.limit)}</span>
            </div>
          </div>

          {/* Bandwidth */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                <span className="text-xs md:text-sm font-medium">Bandwidth</span>
              </div>
              <span
                className={`text-xs md:text-sm font-bold ${getStatusColor(
                  usage.bandwidth.percentage
                )}`}
              >
                {Math.round(usage.bandwidth.percentage)}%
              </span>
            </div>

            <div className="mb-2">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(
                    usage.bandwidth.percentage
                  )} transition-all`}
                  style={{
                    width: `${Math.min(usage.bandwidth.percentage, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{formatBytes(usage.bandwidth.used)}</span>
              <span>{formatBytes(usage.bandwidth.limit)}/mo</span>
            </div>
          </div>

          {/* Uploads */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                <span className="text-xs md:text-sm font-medium">Uploads</span>
              </div>
              <span
                className={`text-xs md:text-sm font-bold ${getStatusColor(
                  usage.uploads.percentage
                )}`}
              >
                {Math.round(usage.uploads.percentage)}%
              </span>
            </div>

            <div className="mb-2">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(
                    usage.uploads.percentage
                  )} transition-all`}
                  style={{ width: `${Math.min(usage.uploads.percentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{usage.uploads.used.toLocaleString()}</span>
              <span>{usage.uploads.limit.toLocaleString()}/mo</span>
            </div>
          </div>
        </div>

        {/* Warning Messages */}
        {(usage.storage.percentage >= 80 ||
          usage.bandwidth.percentage >= 80 ||
          usage.uploads.percentage >= 80) && (
          <div className="mt-4 p-3 md:p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Approaching Limit
                </p>
                <p className="text-xs md:text-sm text-orange-700 dark:text-orange-300 mt-1">
                  You're using {Math.max(
                    usage.storage.percentage,
                    usage.bandwidth.percentage,
                    usage.uploads.percentage
                  ).toFixed(0)}% of your quota. Consider upgrading to avoid service interruption.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Billing Cycle Info */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-base md:text-lg font-semibold">Billing Information</h3>
        </div>

        <div className="space-y-3 text-sm md:text-base">
          <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Billing Cycle</span>
            <span className="font-medium capitalize">{billing.billingCycle}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Cycle Started</span>
            <span className="font-medium">
              {new Date(usage.billingCycleStart).toLocaleDateString()}
            </span>
          </div>

          {billing.nextBillingDate && (
            <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Next Billing</span>
              <span className="font-medium">
                {new Date(billing.nextBillingDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {billing.manuallyApproved && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Plan manually approved
                {billing.approvedAt && (
                  <span className="ml-1">
                    on {new Date(billing.approvedAt).toLocaleDateString()}
                  </span>
                )}
              </p>
              {billing.notes && (
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Note: {billing.notes}
                </p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
