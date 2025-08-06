import { useState, useEffect } from 'react';
import {
  getFeatureFlags,
  markFeatureViewed,
  type Feature,
  getViewedFeatureIds,
  setViewedFeatureIds as persistViewedFeatureIds,
} from '~/lib/api/features';

export const useFeatures = () => {
  const [hasNewFeatures, setHasNewFeatures] = useState(false);
  const [unviewedFeatures, setUnviewedFeatures] = useState<Feature[]>([]);
  const [viewedFeatureIds, setViewedFeatureIds] = useState<string[]>(() => getViewedFeatureIds());

  useEffect(() => {
    const checkNewFeatures = async () => {
      try {
        const features = await getFeatureFlags();
        const unviewed = features.filter((feature) => !viewedFeatureIds.includes(feature.id));
        setUnviewedFeatures(unviewed);
        setHasNewFeatures(unviewed.length > 0);
      } catch (error) {
        console.error('Failed to check for new features:', error);
      }
    };

    checkNewFeatures();
  }, [viewedFeatureIds]);

  const acknowledgeFeature = async (featureId: string) => {
    try {
      await markFeatureViewed(featureId);

      const newViewedIds = [...viewedFeatureIds, featureId];
      setViewedFeatureIds(newViewedIds);
      persistViewedFeatureIds(newViewedIds);
      setUnviewedFeatures((prev) => prev.filter((feature) => feature.id !== featureId));
      setHasNewFeatures(unviewedFeatures.length > 1);
    } catch (error) {
      console.error('Failed to acknowledge feature:', error);
    }
  };

  const acknowledgeAllFeatures = async () => {
    try {
      await Promise.all(unviewedFeatures.map((feature) => markFeatureViewed(feature.id)));

      const newViewedIds = [...viewedFeatureIds, ...unviewedFeatures.map((f) => f.id)];
      setViewedFeatureIds(newViewedIds);
      persistViewedFeatureIds(newViewedIds);
      setUnviewedFeatures([]);
      setHasNewFeatures(false);
    } catch (error) {
      console.error('Failed to acknowledge all features:', error);
    }
  };

  return { hasNewFeatures, unviewedFeatures, acknowledgeFeature, acknowledgeAllFeatures };
};
