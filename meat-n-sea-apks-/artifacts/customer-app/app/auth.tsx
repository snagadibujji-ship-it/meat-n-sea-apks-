import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRequestOtp, useVerifyOtp } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import colors from "@/constants/colors";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setAuth } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const requestMutation = useRequestOtp();
  const verifyMutation = useVerifyOtp();

  const handleRequestOtp = async () => {
    if (phone.length < 10) {
      Alert.alert("Invalid phone", "Enter a valid 10-digit number");
      return;
    }
    try {
      const res = await requestMutation.mutateAsync({ data: { phone: `+91${phone}` } });
      if (res.devOtp) setDevOtp(res.devOtp);
      setStep("otp");
    } catch {
      Alert.alert("Error", "Could not send OTP. Check the server connection.");
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      Alert.alert("Invalid OTP", "Enter the OTP you received");
      return;
    }
    try {
      const res = await verifyMutation.mutateAsync({ data: { phone: `+91${phone}`, code: otp } });
      setAuth({ token: res.token, userId: res.userId, role: res.role });
      router.back();
    } catch {
      Alert.alert("Invalid OTP", "The code entered is incorrect. Try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={20} color={colors.light.foreground} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.headerWrap}>
          <View style={styles.logoCircle}>
            <Feather name="anchor" size={28} color={colors.light.primaryForeground} />
          </View>
          <Text style={styles.heading}>
            {step === "phone" ? "Welcome Back" : "Enter OTP"}
          </Text>
          <Text style={styles.subheading}>
            {step === "phone"
              ? "Sign in with your mobile number"
              : `We sent a code to +91 ${phone}`}
          </Text>
        </View>

        {step === "phone" ? (
          <View style={styles.inputSection}>
            <View style={styles.phoneRow}>
              <View style={styles.dialCode}>
                <Text style={styles.dialCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="10-digit number"
                placeholderTextColor={colors.light.mutedForeground}
                keyboardType="number-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, phone.length !== 10 && styles.primaryBtnDisabled]}
              onPress={handleRequestOtp}
              disabled={phone.length !== 10 || requestMutation.isPending}
            >
              {requestMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputSection}>
            {devOtp && (
              <View style={styles.devBanner}>
                <Feather name="info" size={14} color={colors.light.accent} />
                <Text style={styles.devBannerText}>Dev OTP: {devOtp}</Text>
              </View>
            )}
            <TextInput
              style={styles.otpInput}
              placeholder="• • • • • •"
              placeholderTextColor={colors.light.mutedForeground}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              autoFocus
              textAlign="center"
            />
            <TouchableOpacity
              style={[styles.primaryBtn, otp.length < 4 && styles.primaryBtnDisabled]}
              onPress={handleVerifyOtp}
              disabled={otp.length < 4 || verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Verify & Sign In</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.backLink} onPress={() => setStep("phone")}>
              <Text style={styles.backLinkText}>Change number</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  closeBtn: {
    alignSelf: "flex-end",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.light.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  headerWrap: {
    alignItems: "center",
    paddingVertical: 36,
    gap: 10,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  heading: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  subheading: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.light.mutedForeground,
    textAlign: "center",
  },
  inputSection: {
    gap: 14,
  },
  phoneRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: colors.radius,
    backgroundColor: colors.light.card,
    overflow: "hidden",
  },
  dialCode: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: colors.light.muted,
    borderRightWidth: 1,
    borderRightColor: colors.light.border,
    justifyContent: "center",
  },
  dialCodeText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: colors.light.foreground,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: colors.light.foreground,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: colors.radius,
    backgroundColor: colors.light.card,
    paddingVertical: 16,
    fontSize: 28,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
    letterSpacing: 12,
  },
  primaryBtn: {
    backgroundColor: colors.light.primary,
    borderRadius: colors.radius,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  backLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.light.accent,
  },
  devBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${colors.light.accent}15`,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: `${colors.light.accent}30`,
  },
  devBannerText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: colors.light.accent,
  },
});
