// app/forgot-password.tsx
import * as Linking from 'expo-linking';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { supabase } from "../lib/supabase";
import GradientText from "./GradientText";


export default function ForgotPasswordPage() {
 const [netId, setNetId] = useState("");
 const [emailSent, setEmailSent] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const router = useRouter();


 // 🔄 Animation values
 const scale1 = useSharedValue(1);
 const scale2 = useSharedValue(1);
 const scale3 = useSharedValue(1);
 const opacity1 = useSharedValue(0.3);
 const opacity2 = useSharedValue(0.3);
 const opacity3 = useSharedValue(0.3);


 useEffect(() => {
   const pulse = (scale: any, opacity: any, s1: number, s2: number, dur: number) => {
     scale.value = withRepeat(
       withSequence(
         withTiming(s1, { duration: dur, easing: Easing.inOut(Easing.ease) }),
         withTiming(s2, { duration: dur, easing: Easing.inOut(Easing.ease) })
       ),
       -1,
       false
     );
     opacity.value = withRepeat(
       withSequence(
         withTiming(0.6, { duration: dur, easing: Easing.inOut(Easing.ease) }),
         withTiming(0.3, { duration: dur, easing: Easing.inOut(Easing.ease) })
       ),
       -1,
       false
     );
   };
   pulse(scale1, opacity1, 1.2, 1, 2000);
   pulse(scale2, opacity2, 1.3, 1, 2500);
   pulse(scale3, opacity3, 1.15, 1, 3000);
 }, []);


 const animatedStyle1 = useAnimatedStyle(() => ({
   transform: [{ scale: scale1.value }],
   opacity: opacity1.value,
 }));
 const animatedStyle2 = useAnimatedStyle(() => ({
   transform: [{ scale: scale2.value }],
   opacity: opacity2.value,
 }));
 const animatedStyle3 = useAnimatedStyle(() => ({
   transform: [{ scale: scale3.value }],
   opacity: opacity3.value,
 }));


 const validateNetId = (netId: string) => {
   const netIdRegex = /^[a-zA-Z0-9]{2,20}$/;
   return netId.trim().length > 0 && netIdRegex.test(netId.trim());
 };


 const handleSendResetLink = async () => {
   if (!validateNetId(netId)) return;
   setIsLoading(true);
   const email = `${netId.toLowerCase()}@georgetown.edu`;

   try {
     const redirectUrl = Linking.createURL('newPassword'); // creates a valid URL for dev / custom scheme
     const { error } = await supabase.auth.resetPasswordForEmail(email, {
       redirectTo: redirectUrl,
     });

     if (error) {
       Alert.alert("Error", error.message || "Failed to send reset email.");
     } else {
       setEmailSent(true);
     }
   } catch (err) {
     Alert.alert("Error", "An unexpected error occurred. Please try again.");
   } finally {
     setIsLoading(false);
   }
 };


 if (emailSent) {
   return (
     <View style={styles.container}>
       {/* Animated circles */}
       <Animated.View style={[styles.circle1, animatedStyle1]} />
       <Animated.View style={[styles.circle2, animatedStyle2]} />
       <Animated.View style={[styles.circle3, animatedStyle3]} />


       <View style={styles.successContainer}>
         <Text style={styles.successEmoji}>✓</Text>


         <View style={styles.centerTitle}>
           <GradientText fontFamily="Jost_500Medium" fontSize={32} width={260}>
             Check your email
           </GradientText>
         </View> 


         <Text style={styles.successText}>We sent a password reset link to</Text>
         <Text style={styles.emailText}>{netId.toLowerCase()}@georgetown.edu</Text>
         <Text style={styles.instructionText}>The link will expire in 24 hours.</Text>


         <TouchableOpacity onPress={() => router.back()} style={styles.button}>
           <Text style={styles.buttonText}>Back to Sign In</Text>
         </TouchableOpacity>
       </View>


       {/* Bottom notice with thin red line */}
       <View style={styles.bottomNotice}>
         <View style={styles.redDivider} />
         <TouchableOpacity
           onPress={() => {
             setEmailSent(false);
             handleSendResetLink();
           }}
           style={styles.bottomResendRow}
           disabled={isLoading}
         >
           <Text style={styles.resendText}>Didn't receive the email? </Text>
           <GradientText fontSize={14}>{isLoading ? "Sending..." : "Resend"}</GradientText>
         </TouchableOpacity>
       </View>
     </View>
   );
 }


 return (
   <View style={styles.container}>
     {/* Animated circles */}
     <Animated.View style={[styles.circle1, animatedStyle1]} />
     <Animated.View style={[styles.circle2, animatedStyle2]} />
     <Animated.View style={[styles.circle3, animatedStyle3]} />




     <View style={styles.headerRow}>
       <GradientText fontFamily="Jost_500Medium" fontSize={36}>
         Reset Password
       </GradientText>
     </View>


     <View style={styles.formContainer}>
       <Text style={styles.description}>
         Enter your Georgetown NetID and we'll send you a link to reset your password.
       </Text>


       <Text style={styles.label}>Georgetown NetID</Text>
       <View style={styles.inputContainer}>
         <TextInput
           placeholder="NetID"
           value={netId}
           onChangeText={setNetId}
           style={styles.tfInput}
           autoCapitalize="none"
           autoCorrect={false}
           autoFocus
         />
         <Text style={styles.domainText}>@georgetown.edu</Text>
       </View>


       <TouchableOpacity
         onPress={handleSendResetLink}
         style={[
           styles.button,
           (!validateNetId(netId) || isLoading) && styles.buttonDisabled
         ]}
         disabled={!validateNetId(netId) || isLoading}
       >
         <Text style={styles.buttonText}>
           {isLoading ? "Sending..." : "Send Reset Link"}
         </Text>
       </TouchableOpacity>
     </View>


     {/* Bottom notice with thin red line (same as success state) */}
     <View style={styles.bottomNotice}>
       <View style={styles.redDivider} />
       <View style={styles.bottomResendRow}>
         <Text style={styles.footerText}>Remember your password?</Text>
         <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 4 }}>
           <GradientText fontSize={12}>Sign In</GradientText>
         </TouchableOpacity>
       </View>
     </View>
   </View>
 );
}


const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: "#fffcf4",
   padding: 20,
   // keep centered form; bottomNotice is absolutely positioned
   justifyContent: "center",
   overflow: "hidden",
 },
 // Animated background circles used by the page
 circle1: {
   position: 'absolute',
   width: 360,
   height: 360,
   borderRadius: 180,
   backgroundColor: '#FDE8E8',
   top: -120,
   left: -80,
 },
 circle2: {
   position: 'absolute',
   width: 280,
   height: 280,
   borderRadius: 140,
   backgroundColor: '#FBE5E5',
   top: -80,
   right: -60,
 },
 circle3: {
   position: 'absolute',
   width: 220,
   height: 220,
   borderRadius: 110,
   backgroundColor: '#FCECEC',
   bottom: -110,
   left: -40,
 },
 backButton: {
   position: "absolute",
   top: 60,
   left: 20,
 },
 backText: {
   fontSize: 16,
   color: "#D74A4A",
   fontFamily: "Jost_500Medium",
 },
 footerContainer: {
   alignItems: "center",
   width: "100%",
   justifyContent: "center",
   flexDirection: "row",
   marginBottom: 20,
 },
 formContainer: {
   marginBottom: 40,
 },
 description: {
   fontSize: 16,
   color: "#666",
   textAlign: "center",
   marginBottom: 30,
   lineHeight: 24,
   fontFamily: "Jost_400Regular",
 },
 headerRow: {
   alignItems: 'center',
   width: '100%',
   marginLeft: 53,
   justifyContent: 'center',
   marginBottom: 12,
 },
 label: {
   fontSize: 16,
   fontWeight: "600",
   marginBottom: 8,
   color: "#333",
 },
 inputContainer: {
   flexDirection: "row",
   alignItems: "center",
   borderWidth: 1,
   borderColor: "#ddd",
   borderRadius: 8,
   backgroundColor: "#fff",
   marginBottom: 20,
 },
 tfInput: {
   flex: 1,
   padding: 12,
   fontSize: 16,
 },
 domainText: {
   color: "#666",
   fontSize: 16,
   paddingRight: 12,
 },
 button: {
   backgroundColor: "#D74A4A",
   borderRadius: 8,
   padding: 16,
   alignItems: "center",
   marginTop: 10,
 },
 buttonDisabled: {
   backgroundColor: "#666",
 },
 buttonText: {
   color: "#fff",
   fontSize: 18,
   fontWeight: "600",
 },
 footerText: {
   fontSize: 12,
   color: "#666",
   textAlign: "center",
   lineHeight: 18,
   fontFamily: "Jost_400Regular",
 },
  // Success state styles
 successContainer: {
   alignItems: 'center',
   justifyContent: 'center',
   paddingHorizontal: 20,
   width: '100%', // ensure full width for centering
 },
 successHeader: {
   paddingLeft: 0,
   marginLeft: 53,
   alignItems: 'center',
   width: '100%',
   justifyContent: 'center',
   marginBottom: 60,
 },
 successEmoji: {
   fontSize: 64,
   marginBottom: 20,
   color: "#4CAF50",
 },
 successText: {
   fontSize: 16,
   color: "#666",
   textAlign: "center",
   marginTop: 10,
   marginBottom: 8,
   fontFamily: "Jost_400Regular",
 },
 emailText: {
   fontSize: 18,
   color: "#333",
   fontWeight: "600",
   marginBottom: 20,
   fontFamily: "Jost_500Medium",
 },
 instructionText: {
   fontSize: 14,
   color: "#666",
   textAlign: "center",
   marginBottom: 30,
   lineHeight: 22,
   paddingHorizontal: 20,
   fontFamily: "Jost_400Regular",
 },
 resendContainer: {
   marginTop: 20,
 },
 resendText: {
   fontSize: 14,
   color: "#666",
   textAlign: "center",
   fontFamily: "Jost_400Regular",
 },
 centerTitle: {
   alignItems: 'center',
   justifyContent: 'center',
   width: '100%',
   marginLeft: 13,
   marginBottom: 20,
 },
 bottomNotice: {
   position: 'absolute',
   left: 0,
   right: 0,
   bottom: 0,
   paddingHorizontal: 20,
   paddingBottom: 20,
   backgroundColor: '#fffcf4',
 },
 redDivider: {
   height: 1,
   width: '100%',
   backgroundColor: '#D74A4A',
   marginBottom: 20,
 },
 bottomResendRow: {
   flexDirection: 'row',
   justifyContent: 'center',
   alignItems: 'center',
 },
});

