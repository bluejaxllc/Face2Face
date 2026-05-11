/**
 * Register Screen — Multi-step registration flow
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { triggerLightTap, triggerSuccess, triggerError, triggerSelectionChanged } from '@/services/haptics';
import { Ionicons } from '@expo/vector-icons';

type Step = 'credentials' | 'profile' | 'preferences';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [step, setStep] = useState<Step>('credentials');
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [age, setAge] = useState('');
  const [datingPreference, setDatingPreference] = useState<'men' | 'women'>('men');

  const handleNext = () => {
    triggerSelectionChanged();
    if (step === 'credentials') {
      if (!username.trim() || !password.trim() || !email.trim()) {
        triggerError();
        Alert.alert('Missing Fields', 'Please fill in all fields.');
        return;
      }
      if (password.length < 6) {
        triggerError();
        Alert.alert('Weak Password', 'Password must be at least 6 characters.');
        return;
      }
      setStep('profile');
    } else if (step === 'profile') {
      if (!firstName.trim() || !lastName.trim() || !age.trim()) {
        triggerError();
        Alert.alert('Missing Fields', 'Please fill in your name and age.');
        return;
      }
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 18) {
        triggerError();
        Alert.alert('Invalid Age', 'You must be at least 18 years old.');
        return;
      }
      setStep('preferences');
    }
  };

  const handleBack = () => {
    triggerLightTap();
    if (step === 'profile') setStep('credentials');
    else if (step === 'preferences') setStep('profile');
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      await register({
        username: username.trim(),
        password,
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        age: parseInt(age),
        datingPreference,
      });
      triggerSuccess();
      router.replace('/(tabs)/map');
    } catch (error: any) {
      triggerError();
      Alert.alert('Registration Failed', error.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const stepIndex = step === 'credentials' ? 0 : step === 'profile' ? 1 : 2;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#94a3b8" />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Step {stepIndex + 1} of 3</Text>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              {[0, 1, 2].map(i => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    i <= stepIndex && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Step: Credentials */}
          {step === 'credentials' && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#475569"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#475569"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password (min 6 characters)"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>
          )}

          {/* Step: Profile */}
          {step === 'profile' && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  placeholderTextColor="#475569"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  placeholderTextColor="#475569"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  placeholderTextColor="#475569"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="number-pad"
                />
              </View>

              {/* Gender selector */}
              <Text style={styles.selectorLabel}>I am</Text>
              <View style={styles.selectorRow}>
                <TouchableOpacity
                  style={[styles.selectorButton, gender === 'male' && styles.selectorActive]}
                  onPress={() => { triggerLightTap(); setGender('male'); }}
                >
                  <Text style={[styles.selectorText, gender === 'male' && styles.selectorTextActive]}>
                    ♂ Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorButton, gender === 'female' && styles.selectorActive]}
                  onPress={() => { triggerLightTap(); setGender('female'); }}
                >
                  <Text style={[styles.selectorText, gender === 'female' && styles.selectorTextActive]}>
                    ♀ Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step: Preferences */}
          {step === 'preferences' && (
            <View style={styles.form}>
              <Text style={styles.selectorLabel}>I'm interested in</Text>
              <View style={styles.selectorRow}>
                <TouchableOpacity
                  style={[styles.selectorButton, datingPreference === 'men' && styles.selectorActiveBlue]}
                  onPress={() => { triggerLightTap(); setDatingPreference('men'); }}
                >
                  <Text style={[styles.selectorText, datingPreference === 'men' && styles.selectorTextActive]}>
                    ♂ Men
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectorButton, datingPreference === 'women' && styles.selectorActivePink]}
                  onPress={() => { triggerLightTap(); setDatingPreference('women'); }}
                >
                  <Text style={[styles.selectorText, datingPreference === 'women' && styles.selectorTextActive]}>
                    ♀ Women
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.readyCard}>
                <Ionicons name="sparkles" size={32} color="#fbbf24" />
                <Text style={styles.readyTitle}>You're all set!</Text>
                <Text style={styles.readySubtitle}>
                  You can update your profile, add a bio, and a profile photo after you sign up.
                </Text>
              </View>
            </View>
          )}

          {/* Navigation buttons */}
          <View style={styles.buttonRow}>
            {step !== 'credentials' && (
              <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                <Ionicons name="arrow-back" size={20} color="#94a3b8" />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.nextButton, isLoading && styles.loginButtonDisabled]}
              onPress={step === 'preferences' ? handleRegister : handleNext}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.nextButtonText}>
                  {step === 'preferences' ? 'Create Account' : 'Next'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
  },
  progressDotActive: {
    backgroundColor: '#3b82f6',
  },
  form: {
    gap: 16,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 16,
  },
  selectorLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  selectorButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorActive: {
    borderColor: '#ec4899',
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
  },
  selectorActiveBlue: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  selectorActivePink: {
    borderColor: '#ec4899',
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
  },
  selectorText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  selectorTextActive: {
    color: '#f1f5f9',
  },
  readyCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  readyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    marginTop: 12,
  },
  readySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  backBtnText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
