import React, { useState, useMemo, useCallback } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const FAQS_DATA = [
  {
    id: "1",
    question: "Why can't I log in after OTP verification?",
    answer: "OTP verification confirms control of your phone number, but it does not bypass pending, rejected, suspended, or correction-required KYC approval. Your account will activate once KYC is approved by Admin."
  },
  {
    id: "2",
    question: "Which KYC documents are required?",
    answer: "The onboarding flow requires Aadhaar card (front and back), PAN card, and a clear profile photo, subject to regional regulatory configuration."
  },
  {
    id: "3",
    question: "What does 'Correction Required' mean?",
    answer: "An Admin or compliance reviewer has reviewed your KYC or property submission and requested specific corrections. Open the item to view the reviewer notes and resubmit."
  },
  {
    id: "4",
    question: "Can I edit a submitted property?",
    answer: "Edits depend on the approval state. Pending or correction-requested listings allow changes; once a property is fully approved and published, edits may be restricted or require re-verification."
  },
  {
    id: "5",
    question: "Why was my client marked duplicate?",
    answer: "The platform checks existing records across the network to avoid conflicting attribution. If another partner previously registered this client or they are already active, attribution goes to the prior record. You can raise a support ticket if you believe this was in error."
  },
  {
    id: "6",
    question: "Where do I track my property and client progress?",
    answer: "Use 'My Added' in your partner dashboard to view real-time submission review, site visit schedules, deal closures, and milestone payment updates."
  },
  {
    id: "7",
    question: "When do I earn commission?",
    answer: "Commission is earned only when the configured attribution and deal/payment conditions are met. Client or property submission alone does not guarantee a commission credit."
  },
  {
    id: "8",
    question: "What is the Wallet?",
    answer: "The Wallet is your real-time commission ledger showing Available Balance, Pending Balance, Lifetime Earned, and Withdrawn amounts."
  },
  {
    id: "9",
    question: "How do I add or update bank details?",
    answer: "Navigate to Wallet > Bank Details, enter your bank account number and IFSC code, and submit for admin verification before requesting payouts."
  },
  {
    id: "10",
    question: "Why can't I withdraw my full total?",
    answer: "Withdrawal requests cannot exceed your 'Available Balance'. Funds in 'Pending' or 'Held' states are awaiting milestone reconciliation and cannot be withdrawn yet."
  },
  {
    id: "11",
    question: "Where can I track my withdrawal status?",
    answer: "Open Withdrawal History in your Wallet to check status updates: Requested, Under Review, Approved, Processing, Completed, Rejected, or Reversed."
  },
  {
    id: "12",
    question: "How do I dispute commission or withdrawal status?",
    answer: "Raise a contextual support ticket under 'Commission / Wallet' with the relevant deal ID, commission entry reference, or withdrawal transaction ID."
  }
];

const SCROLL_CONTENT_STYLE = { paddingBottom: 40 };
const BACK_HIT_SLOP = 12;
const CLOSE_HIT_SLOP = 8;

const FaqItem = React.memo(({ item, index, isExpanded, onToggle }) => {
  const handleToggle = useCallback(() => {
    onToggle(item.id);
  }, [item.id, onToggle]);

  return (
    <View className="bg-white rounded-xl mb-3 border border-gray-200 overflow-hidden shadow-xs">
      <Pressable
        onPress={handleToggle}
        className="p-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1 pr-3">
          <View className="w-6 h-6 rounded-full bg-[#EEECFF] items-center justify-center mr-3">
            <Text className="text-xs font-manrope-bold text-[#4A43EC]">
              {index + 1}
            </Text>
          </View>
          <Text className="flex-1 text-sm font-manrope-bold text-gray-900 leading-snug">
            {item.question}
          </Text>
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#6B7280"
        />
      </Pressable>

      {isExpanded && (
        <View className="px-4 pb-4 pt-1 border-t border-gray-100 bg-[#FAFAFF]">
          <Text className="text-xs font-manrope text-gray-600 leading-relaxed">
            {item.answer}
          </Text>
        </View>
      )}
    </View>
  );
});

FaqItem.displayName = "FaqItem";

export default function BrokerFAQsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState({ "1": true });

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleOpenContactDesk = useCallback(() => {
    router.push("/(screens)/contact-us");
  }, [router]);

  const toggleExpand = useCallback((id) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQS_DATA;
    const q = searchQuery.toLowerCase();
    return FAQS_DATA.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#F8F9FE]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <Pressable
          onPress={handleBack}
          hitSlop={BACK_HIT_SLOP}
          className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center border border-gray-200"
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
        <Text className="text-lg font-manrope-bold text-gray-900">
          Channel Partner FAQs
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={SCROLL_CONTENT_STYLE}
      >
        {/* Search Bar */}
        <View className="px-5 pt-5 pb-2">
          <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 shadow-sm">
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search partner questions..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-2.5 text-sm font-manrope text-gray-900"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={handleClearSearch} hitSlop={CLOSE_HIT_SLOP}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Subtitle */}
        <View className="px-5 pt-3 pb-4">
          <Text className="text-xs font-manrope-medium text-gray-500 uppercase tracking-wider">
            Partner Operations Guide ({filteredFaqs.length} Questions)
          </Text>
        </View>

        {/* Accordion List */}
        <View className="px-5">
          {filteredFaqs.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center justify-center border border-gray-200 mt-2">
              <Ionicons name="help-circle-outline" size={44} color="#D1D5DB" />
              <Text className="text-base font-manrope-bold text-gray-800 mt-3">
                No matching answers
              </Text>
              <Text className="text-xs font-manrope text-gray-500 text-center mt-1">
                Try searching with different keywords or contact the partner desk.
              </Text>
              <Pressable
                onPress={handleClearSearch}
                className="mt-4 px-4 py-2 bg-gray-100 rounded-lg"
              >
                <Text className="text-xs font-manrope-semibold text-gray-700">Clear Search</Text>
              </Pressable>
            </View>
          ) : (
            filteredFaqs.map((item, index) => (
              <FaqItem
                key={item.id}
                item={item}
                index={index}
                isExpanded={!!expandedIds[item.id]}
                onToggle={toggleExpand}
              />
            ))
          )}
        </View>

        {/* Contact Support Card */}
        <View className="mx-5 mt-6 p-5 bg-[#EEECFF]/70 rounded-2xl border border-[#D9D6FE]">
          <View className="flex-row items-start">
            <View className="w-10 h-10 rounded-full bg-[#4A43EC]/15 items-center justify-center mr-3.5">
              <Ionicons name="chatbubbles-outline" size={20} color="#4A43EC" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-manrope-bold text-gray-900">
                Need Help with Deals or Wallet?
              </Text>
              <Text className="text-xs font-manrope text-gray-600 mt-1 leading-relaxed">
                Our Channel Partner support desk is ready to resolve commission disputes, KYC verifications, and withdrawal inquiries.
              </Text>
              <Pressable
                onPress={handleOpenContactDesk}
                className="mt-3.5 bg-[#4A43EC] self-start px-4 py-2 rounded-lg active:opacity-80 flex-row items-center"
              >
                <Text className="text-xs font-manrope-bold text-white mr-1.5">
                  Contact Partner Desk
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
