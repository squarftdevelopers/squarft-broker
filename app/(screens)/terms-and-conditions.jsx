import React, { useCallback } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const SCROLL_CONTENT_STYLE = { paddingBottom: 50 };
const BACK_HIT_SLOP = 12;

export default function BrokerTermsAndConditionsScreen() {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleOpenPrivacyPolicy = useCallback(() => {
    router.push("/(screens)/privacy-policy");
  }, [router]);

  const handleOpenContactDesk = useCallback(() => {
    router.push("/(screens)/contact-us");
  }, [router]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F8F9FE]">
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <Pressable
          onPress={handleBack}
          hitSlop={BACK_HIT_SLOP}
          className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center border border-gray-200"
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-lg font-manrope-bold text-gray-900">
          Terms & Conditions
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={SCROLL_CONTENT_STYLE}
        className="px-5"
      >
        {/* Document Header Card */}
        <View className="bg-white rounded-2xl p-5 border border-gray-200 mt-4 mb-4 shadow-xs">
          <View className="flex-row items-center mb-2">
            <View className="px-2.5 py-1 rounded-full bg-[#EEECFF] border border-[#D9D6FE] mr-2">
              <Text className="text-[11px] font-manrope-bold text-[#4A43EC]">
                CHANNEL PARTNER
              </Text>
            </View>
            <Text className="text-xs font-manrope text-gray-500">
              Effective: September 2026
            </Text>
          </View>
          <Text className="text-base font-manrope-bold text-gray-900 leading-snug">
            Channel Partner Agreement & Platform Terms
          </Text>
          <Text className="text-xs font-manrope text-gray-500 mt-1">
            Operated by squarFT by Paxtrade Global Pvt. Ltd.
          </Text>
        </View>

        {/* Critical Operational Rules Callout */}
        <View className="bg-purple-50 rounded-2xl p-4 border border-purple-200/80 mb-5">
          <View className="flex-row items-center mb-2">
            <Ionicons name="shield-checkmark" size={18} color="#6B21A8" />
            <Text className="text-xs font-manrope-bold text-purple-900 ml-1.5 uppercase tracking-wide">
              Partner Operational Rules
            </Text>
          </View>
          <Text className="text-xs font-manrope text-purple-950 leading-relaxed">
            Operational access begins only after required KYC approval. Property and client submissions can be reviewed, corrected, rejected, deduplicated or approved. You must possess lawful authority to submit client, owner, property, and bank details.
          </Text>
          <Text className="text-xs font-manrope text-purple-950 leading-relaxed mt-2 font-manrope-semibold">
            Commission & Payouts: Commission is not guaranteed by submission alone; entitlement follows configured attribution and deal/payment milestones. Withdrawals require verified bank accounts and Admin processing.
          </Text>
        </View>

        {/* Section 1 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            1. Acceptance and Scope
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            These Terms govern access to and use of this Squar FT Channel Partner application. By registering, logging in or using the app, you agree to these Terms and the Privacy Policy. The app is part of the connected Squar FT operating system, and permitted records synchronize with Admin, support, project, visit, deal, and payment modules.
          </Text>
        </View>

        {/* Section 2 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            2. Eligibility and Account Security
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            Provide accurate information, use a mobile number you are authorized to use, keep OTPs and credentials confidential, and promptly report suspected unauthorized use. OTP verification confirms control of a mobile number; it does not by itself guarantee identity, ownership, authority, project approval, payment status or transaction completion.
          </Text>
        </View>

        {/* Section 3 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            3. Accurate Information and Documents
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            Information, documents, photographs, property/project details, KYC records, payment references, feedback and other submissions must be accurate and lawfully provided. Do not impersonate another person, upload forged or misleading documents, submit content without authority, or misuse another person&apos;s personal information.
          </Text>
        </View>

        {/* Section 4 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            4. Platform Records, Deduplication and Approvals
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            Some records are subject to verification, correction, approval, rejection, suspension or administrative review. A draft, submission, recommendation, displayed status or notification is not a substitute for legal, financial, technical, title, RERA, regulatory or professional due diligence. Client deduplication rules apply across partner submissions.
          </Text>
        </View>

        {/* Section 5 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            5. Acceptable Use
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            Do not attempt unauthorized access, bypass role/branch restrictions, interfere with security controls, scrape protected data at scale, send spam, introduce malicious code, manipulate operational records, or use the service for unlawful, fraudulent, abusive or misleading activity.
          </Text>
        </View>

        {/* Section 6 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            6. Third-Party Services
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            The app may rely on maps, OTP/SMS gateways, push notifications, cloud storage, device permissions, external calling or banking/payout integrations. Independent third-party services maintain their own terms and availability.
          </Text>
        </View>

        {/* Section 7 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            7. Availability and Changes
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            Features may be updated, suspended, limited or discontinued for maintenance, security, legal, operational or product reasons. Terms and policies may be revised; the current effective version is available in-app and on the official website.
          </Text>
        </View>

        {/* Section 8 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            8. Suspension and Termination
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            Partner access may be restricted for security risk, policy breach, invalid or rejected KYC, misuse, fraud indicators, unauthorized activity, or regulatory orders. Logout revokes the current active session; account closure is handled separately.
          </Text>
        </View>

        {/* Section 9 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            9. Intellectual Property
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            The app, brand, partner portals, software, workflows, graphics, and materials are owned by or licensed to squarFT by Paxtrade Global Pvt. Ltd., except user-provided content.
          </Text>
        </View>

        {/* Section 10 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            10. Applicable Law & Jurisdiction
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            These Terms are governed by applicable laws of India. Any legal dispute or proceeding arising out of or related to this partner agreement shall be subject to the exclusive jurisdiction of the courts in Indore, Madhya Pradesh, India.
          </Text>
        </View>

        {/* Footer Links */}
        <View className="flex-row items-center justify-between p-4 bg-gray-100 rounded-xl mt-2">
          <Pressable
            onPress={handleOpenPrivacyPolicy}
            className="flex-row items-center"
          >
            <Text className="text-xs font-manrope-bold text-[#4A43EC] mr-1">
              Privacy Policy
            </Text>
            <Ionicons name="arrow-forward" size={14} color="#4A43EC" />
          </Pressable>
          <Pressable
            onPress={handleOpenContactDesk}
            className="flex-row items-center"
          >
            <Text className="text-xs font-manrope-bold text-gray-700 mr-1">
              Contact Desk
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#4B5563" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
