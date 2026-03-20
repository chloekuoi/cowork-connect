import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { loadClickSound, unloadClickSound } from './audioService';
import { GrainOverlay } from './components/GrainOverlay';
import { onboardingTheme as t } from './theme';

// Screen components — imported once each is created
// Placeholder imports will be replaced when screens are implemented
// For now, CinematicOnboardingFlow exports the state interface and navigation contract

export interface OnboardingState {
  name: string;
  photoUri: string | null;
  birthday: string;           // ISO: YYYY-MM-DD
  workType: string;
  currentlyWorkingOn: string;
  school: string;
  notificationsGranted: boolean;
  contactsGranted: boolean;
}

export interface ScreenProps {
  state: OnboardingState;
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>;
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
  onComplete: () => void;
}

interface CinematicOnboardingFlowProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 8;

const INITIAL_STATE: OnboardingState = {
  name: '',
  photoUri: null,
  birthday: '',
  workType: '',
  currentlyWorkingOn: '',
  school: '',
  notificationsGranted: false,
  contactsGranted: false,
};

export function CinematicOnboardingFlow({ onComplete }: CinematicOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE);

  useEffect(() => {
    loadClickSound();
    return () => {
      unloadClickSound();
    };
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(s => s + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  }, [currentStep]);

  const screenProps: ScreenProps = {
    state,
    setState,
    onNext: handleNext,
    onBack: handleBack,
    currentStep,
    totalSteps: TOTAL_STEPS,
    onComplete,
  };

  // Screens will be imported and rendered here (P9-09 through P9-16)
  // Placeholder: render a bare dark background while screens are being implemented
  const renderScreen = () => {
    // This will be filled in once individual screens exist
    // Return null for now — screens P9-09 to P9-16 add the content
    return null;
  };

  return (
    <View style={styles.root}>
      <GrainOverlay />
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: t.bg,
  },
});
