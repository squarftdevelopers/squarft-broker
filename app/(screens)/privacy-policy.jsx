import React, { useCallback } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const SCROLL_CONTENT_STYLE = { paddingBottom: 50 };
const BACK_HIT_SLOP = 12;

export default function BrokerPrivacyPolicyScreen() {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleOpenTerms = useCallback(() => {
    router.push("/(screens)/terms-and-conditions");
  }, [router]);

  const handleOpenFaqs = useCallback(() => {
    router.push("/(screens)/faqs");
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
          Privacy Policy
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
                PARTNER PRIVACY
              </Text>
            </View>
            <Text className="text-xs font-manrope text-gray-500">
              Effective: September 2026
            </Text>
          </View>
          <Text className="text-base font-manrope-bold text-gray-900 leading-snug">
            Channel Partner Privacy & Data Protection
          </Text>
          <Text className="text-xs font-manrope text-gray-500 mt-1">
            squarFT by Paxtrade Global Pvt. Ltd.
          </Text>
        </View>

        {/* Highlight Card: Data Processed */}
        <View className="bg-[#EEECFF]/80 rounded-2xl p-4 border border-[#D9D6FE] mb-5">
          <View className="flex-row items-center mb-2">
            <Ionicons name="lock-closed" size={18} color="#4A43EC" />
            <Text className="text-xs font-manrope-bold text-[#4A43EC] ml-1.5 uppercase tracking-wide">
              Partner Data Scope & Financial Audit
            </Text>
          </View>
          <Text className="text-xs font-manrope text-gray-900 leading-relaxed">
            The Channel Partner App processes:
          </Text>
          <View className="mt-2 space-y-1">
            <Text className="text-xs font-manrope text-gray-800">
              • Aadhaar, PAN, profile photo and official KYC approval records
            </Text>
            <Text className="text-xs font-manrope text-gray-800">
              • Branch mapping and assigned regional territory
            </Text>
            <Text className="text-xs font-manrope text-gray-800">
              • Client requirements, contact numbers, and deduplication records
            </Text>
            <Text className="text-xs font-manrope text-gray-800">
              • Owner/property details, photos, and seller OTP verification
            </Text>
            <Text className="text-xs font-manrope text-gray-800">
              • Commission attribution, ledger entries, and deal progress
            </Text>
            <Text className="text-xs font-manrope text-gray-800">
              • Verified bank account details and withdrawal transaction references
            </Text>
          </View>
        </View>

        {/* Section 1 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            1. What this Policy Covers
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            This Privacy Policy explains how information is collected, used, shared, secured, retained and handled when you use the Squar FT Channel Partner application and connected partner workflows.
          </Text>
        </View>

        {/* Section 2 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            2. Common Data We May Process
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            Categories include mobile number and OTP verification logs; partner name and photo; device identifier, session and security records; app preferences; notification logs; partner support tickets; and operational audit entries needed to connect your account with Squar FT back-office systems.
          </Text>
        </View>

        {/* Section 3 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            3. Purpose of Processing
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            We use information to authenticate partners, conduct KYC and regulatory compliance checks, verify submitted listings, prevent duplicate client claims, calculate and credit earned commissions, process payout withdrawals to verified bank accounts, troubleshoot failures, and comply with tax and statutory requirements.
          </Text>
        </View>

        {/* Section 4 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            4. Sharing and Internal Access
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            Information is available only to authorized Squar FT administrators, finance teams, compliance auditors, and support personnel subject to strict branch restrictions. Verified banking service providers and payment gateways process payout transactions securely.
          </Text>
        </View>

        {/* Section 5 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            5. Sensitive Financial & Identity Data Security
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            Aadhaar, PAN, bank account numbers, and commission balances are protected using masking, restricted role-based privileges, end-to-end transport encryption, and immutable audit logs.
          </Text>
        </View>

        {/* Section 6 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            6. Data Retention
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            Financial ledger data, payout proofs, TDS records, and completed deal associations must be retained for the minimum statutory periods required by Indian taxation and corporate regulations.
          </Text>
        </View>

        {/* Section 7 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            7. Partner Rights and Account Deletion
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            You may request access to, correction of, or closure of your partner account by emailing privacy@squarft.com. Account deletion is subject to complete payout settlement, clear commission reconciliation, and legal audit retention obligations.
          </Text>
        </View>

        {/* Section 8 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-3 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            8. Device Permissions
          </Text>
          <View className="space-y-1.5 mt-1">
            <Text className="text-xs font-manrope text-gray-600">
              • <Text className="font-manrope-semibold text-gray-800">Camera / Media:</Text> Used to capture Aadhaar/PAN cards, profile photo, property images, and ownership documents.
            </Text>
            <Text className="text-xs font-manrope text-gray-600">
              • <Text className="font-manrope-semibold text-gray-800">Location:</Text> Used for pin-pointing property locations on maps and discovering nearby projects.
            </Text>
            <Text className="text-xs font-manrope text-gray-600">
              • <Text className="font-manrope-semibold text-gray-800">Notifications:</Text> Real-time updates on client progress, deal milestones, and withdrawal transfers.
            </Text>
          </View>
        </View>

        {/* Section 9 */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 mb-4 shadow-xs">
          <Text className="text-sm font-manrope-bold text-gray-900 mb-1.5">
            9. Grievance Officer & Contact
          </Text>
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            For partner privacy questions, data requests, or compliance concerns, contact:
          </Text>
          <Text className="text-xs font-manrope-semibold text-gray-800 mt-2">
            Grievance Officer: Squar FT Compliance Desk
          </Text>
          <Text className="text-xs font-manrope text-gray-600">
            Email: privacy@squarft.com
          </Text>
          <Text className="text-xs font-manrope text-gray-600">
            Office: 214/Sadhguru Pariyan , Vijay nagar, Indore
          </Text>
        </View>

        {/* Footer Links */}
        <View className="flex-row items-center justify-between p-4 bg-gray-100 rounded-xl mt-2">
          <Pressable
            onPress={handleOpenTerms}
            className="flex-row items-center"
          >
            <Text className="text-xs font-manrope-bold text-[#4A43EC] mr-1">
              Terms & Conditions
            </Text>
            <Ionicons name="arrow-forward" size={14} color="#4A43EC" />
          </Pressable>
          <Pressable
            onPress={handleOpenFaqs}
            className="flex-row items-center"
          >
            <Text className="text-xs font-manrope-bold text-gray-700 mr-1">
              View FAQs
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#4B5563" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
