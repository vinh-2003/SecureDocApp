// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import './src/utils/polyfills';

// Import Providers và Navigator đã tách
import AppProviders from './src/providers/AppProviders';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AppProviders>
      
      {/* ActionSheetProvider chỉ được chứa 1 con duy nhất */}
      <ActionSheetProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ActionSheetProvider>

      {/* Đưa Toast ra ngoài ActionSheetProvider, nhưng vẫn trong AppProviders */}
      <Toast />
      
    </AppProviders>
  );
}