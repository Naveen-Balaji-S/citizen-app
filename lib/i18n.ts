import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// --- Supabase Setup (copied from your code) ---
import 'react-native-url-polyfill/auto';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables.');
}

export const supabase = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
// ----------------------------------------------

// Define the translation keys and their values for English and Hindi
const translations = {
  en: {
    translation: {
      // Shared Strings
      app_name: 'Civic Connect',
      submit: 'Submit',
      cancel: 'Cancel',
      ok: 'OK',
      error: 'Error',
      success: 'Success',
      or: 'or',

      // Language Selection Screen
      select_language_title: 'Select Your Language',
      english: 'English',
      hindi: 'Hindi',

      // Login Screen
      login_title: 'Welcome Back',
      login_button: 'Login',
      sign_in_google: 'Sign in with Google',
      signup_prompt: "Don't have an account? Sign Up",
      forgot_password: 'Forgot Password?',
      email_placeholder: 'Email',
      password_placeholder: 'Password',
      login_validation_fields: 'Please enter both email and password.',
      login_failed_title: 'Login Failed',
      auth_error_title: 'Authentication Error',
      password_reset_validation: 'Please enter your email address in the email field to reset your password.',
      password_reset_success: 'A password reset link has been sent to your email address.',
      language_selection_message: 'Language changed to English',

      // Register Screen
      register_title: 'Create an Account',
      register_button: 'Register',
      login_prompt: 'Already have an account? Login',
      registration_success_message: 'Your account has been created! Please check your email for a confirmation link to complete registration.',
      registration_failed_title: 'Registration Failed',
      full_name_placeholder: 'Full Name',
      mobile_placeholder: 'Mobile Number (Optional)',
      register_validation_fields: 'Please fill in your name, email, and password.',

      // Notifications Screen
      notifications_screen_title: 'Notifications',

      // --- Added translations for new screens ---
      // Leaderboard Screen
      leaderboard_title: 'Leaderboard',
      top_contributors: 'Top Contributors',
      points_unit: 'pts',
      leaderboard_fetch_error: 'An error occurred fetching the leaderboard.',
      leaderboard_load_failed: 'Failed to load leaderboard.',

      // Success Screen
      success_title: 'Success Screen',
      report_submitted_success: 'Report Submitted Successfully!',

      // View Reports Screen
      view_reports_title: 'Your Submitted Reports',
      status_label: 'Status:',
      reported_on: 'Reported on:',
      loading_reports: 'Loading Your Reports...',
      no_reports_yet: "You haven't submitted any reports yet.",
      fetch_reports_error: 'Could not fetch your reports. Please try again.',
      
      // Report Statuses
      status_submitted: 'Submitted',
      status_acknowledged: 'Acknowledged',
      status_completed: 'Completed',
      status_unknown: 'Unknown',

      // Home Screen
      dashboard_title: 'Dashboard',
      civic_points_label: '{{points}} Civic Points',
      fetching_location_reports: 'Fetching location and nearby reports...',
      your_location_marker: 'Your Location',
      file_new_report: 'File a New Report',
      my_reports_card: 'My Reports',
      community_reports_card: 'Community Reports',
      leaderboard_card: 'Leaderboard',
      drafts_card: 'Drafts', // <--- ADDED KEY FOR HOMESCREEN CARD CONSISTENCY
      logout_button: 'Logout',
      logged_in_as: 'Logged in as',
      permission_required_title: 'Permission required',
      location_permission_message: 'Location access is needed to show nearby reports.',

      // ReportIssue Screen
      report_issue: {
        "title": "File a New Report",
        "section_photo": "1. Add a Photo",
        "choose_gallery": "Choose from Gallery",
        "take_photo": "Take Photo",
        "section_details": "2. Provide Details",
        "select_department": "Select Department...",
        "description_placeholder": "Describe the issue in detail...",
        "play_audio": "Play Audio",
        "section_location": "3. Set Location",
        "use_current_location": "Current Location",
        "select_on_map": "Select on Map",
        "location_selected": "Location selected: {{latitude}}, {{longitude}}",
        "submit_report": "Submit Report",
        "save_draft": "Save Draft", // <--- ADDED KEY
        "alert_draft_saved": "Draft saved successfully!", // <--- ADDED KEY
        "confirm_location": "Confirm Location",
        "cancel": "Cancel",
        "alert_permission_required": "Permission required",
        "alert_camera_access_needed": "Camera access is needed to take a photo.",
        "alert_location_access_needed_get": "Location access is needed to get your current position.",
        "alert_audio_access_needed": "Audio recording access is needed.",
        "alert_recording_title": "Recording",
        "alert_recording_started_message": "Recording has started. Tap the stop icon to finish.",
        "alert_recording_saved_title": "Recording Saved",
        "alert_recording_saved_message": "Audio recording has been saved.",
        "alert_no_audio_title": "No Audio",
        "alert_no_audio_message": "There is no recorded audio to play.",
        "alert_playback_error_title": "Playback Error",
        "alert_playback_error_message": "Failed to play the recorded audio. Check permissions and file access.",
        "alert_recording_deleted_title": "Recording Deleted",
        "alert_recording_deleted_message": "The recorded audio has been deleted.",
        "alert_wait_title": "Please wait",
        "alert_stop_recording_first_message": "Please stop the audio recording first.",
        "alert_missing_info_title": "Missing Information",
        "alert_missing_info_message": "Please fill out all fields, including a photo, department, and location.",
        "alert_submission_error_title": "Submission Error",
        "alert_unknown_error_message": "An unknown error occurred.",
        "alert_failed_to_start_recording": "Failed to start recording. Please try again.",
        "alert_failed_to_stop_recording": "Failed to stop recording. Please try again.",
        "supabase_notification_title": "Report Submitted",
        "supabase_notification_body": "Your report \"{{description}}\" has been submitted successfully."
      },
      // Community Reports Screen
      community_reports_title: "Community Reports",
      all_departments: "All Departments",
      upvote_button: "Upvote",
      upvotes: "Upvotes: {{count}}",
      upvote_sync_error: "Failed to sync your upvote. Please try again.",
      action_not_allowed: "Action Not Allowed",
      cannot_upvote_own_report: "You cannot upvote your own report.",
      login_to_upvote: "Please log in to upvote a report.",
      // New Filter/Sort Keys for Community Reports
      search_by_description_placeholder: "Search by description...",
      filter_reports_title: "Filter Reports",
      all_status: "All Status",
      department_label: "Department",
      date_range_label: "Date Range",
      all_time: "All Time",
      this_week: "This Week",
      this_month: "This Month",
      sort_by_label: "Sort By",
      newest_first: "Newest First",
      most_upvoted: "Most Upvoted",
      clear_filters_button: "Clear Filters",
      apply_button: "Apply",
      no_community_reports_found: "No reports found.",
      fetch_community_reports_error: "Could not fetch community reports.",
    // --- Drafts Screen (separate namespace)
    drafts: {
      "title": "Saved Drafts",
      "no_description": "No description",
      "saved_at": "Saved: {{time}}",
      "edit_continue": "✏️ Edit & Continue",
      "delete_button": "🗑 Delete",
      "delete_title": "Delete Draft",
      "delete_message": "Are you sure you want to permanently delete this draft?",
      "delete_error": "Could not delete draft.",
      "load_error": "Could not load drafts.",
      "empty": "You have no saved drafts.",
    },
    },
  },
  hi: {
    translation: {
      // Shared Strings
      app_name: 'सिविक कनेक्ट',
      submit: 'जमा करें',
      cancel: 'रद्द करें',
      ok: 'ठीक है',
      error: 'त्रुटि',
      success: 'सफलता',
      or: 'या',

      // Language Selection Screen
      select_language_title: 'अपनी भाषा चुनें',
      english: 'अंग्रेजी',
      hindi: 'हिंदी',

      // Login Screen
      login_title: 'वापस स्वागत है',
      login_button: 'लॉगिन करें',
      sign_in_google: 'Google के साथ साइन इन करें',
      signup_prompt: 'खाता नहीं है? साइन अप करें',
      forgot_password: 'पासवर्ड भूल गए?',
      email_placeholder: 'ईमेल',
      password_placeholder: 'पासवर्ड',
      login_validation_fields: 'कृपया ईमेल और पासवर्ड दोनों दर्ज करें।',
      login_failed_title: 'लॉगिन विफल',
      auth_error_title: 'प्रमाणीकरण त्रुटि',
      password_reset_validation: 'अपना पासवर्ड रीसेट करने के लिए कृपया ईमेल फ़ील्ड में अपना ईमेल पता दर्ज करें।',
      password_reset_success: 'आपके ईमेल पते पर एक पासवर्ड रीसेट लिंक भेजा गया है।',
      language_selection_message: 'भाषा बदलकर हिंदी हो गई है।',

      // Register Screen
      register_title: 'एक खाता बनाएं',
      register_button: 'रजिस्टर करें',
      login_prompt: 'पहले से ही एक खाता है? लॉगिन करें',
      registration_success_message: 'आपका खाता बनाया गया है! पंजीकरण पूरा करने के लिए कृपया अपने ईमेल में पुष्टिकरण लिंक देखें।',
      registration_failed_title: 'पंजीकरण विफल',
      full_name_placeholder: 'पूरा नाम',
      mobile_placeholder: 'मोबाइल नंबर (वैकल्पिक)',
      register_validation_fields: 'कृपया नाम, ईमेल और पासवर्ड भरें।',

      // Notifications Screen
      notifications_screen_title: 'अधिसूचनाएं',

      // --- Added translations for new screens ---
      // Leaderboard Screen
      leaderboard_title: 'लीडरबोर्ड',
      top_contributors: 'शीर्ष योगदानकर्ता',
      points_unit: 'अंक',
      leaderboard_fetch_error: 'लीडरबोर्ड प्राप्त करने में एक त्रुटि हुई।',
      leaderboard_load_failed: 'लीडरबोर्ड लोड करने में विफल रहा।',

      // Success Screen
      success_title: 'सफलता स्क्रीन',
      report_submitted_success: 'रिपोर्ट सफलतापूर्वक जमा की गई!',

      // View Reports Screen
      view_reports_title: 'आपकी सबमिट की गई रिपोर्ट',
      status_label: 'स्थिति:',
      reported_on: 'रिपोर्ट किया गया:',
      loading_reports: 'आपकी रिपोर्ट लोड हो रही हैं...',
      no_reports_yet: 'आपने अभी तक कोई रिपोर्ट जमा नहीं की है।',
      fetch_reports_error: 'आपकी रिपोर्ट प्राप्त नहीं की जा सकी। कृपया पुनः प्रयास करें।',

      // Report Statuses
      status_submitted: 'जमा किया गया',
      status_acknowledged: 'स्वीकृत',
      status_completed: 'पूर्ण',
      status_unknown: 'अज्ञात',

      // Home Screen
      dashboard_title: 'डैशबोर्ड',
      civic_points_label: '{{points}} नागरिक अंक',
      fetching_location_reports: 'स्थान और आस-पास की रिपोर्टें लाई जा रही हैं...',
      your_location_marker: 'आपका स्थान',
      file_new_report: 'एक नई रिपोर्ट दर्ज करें',
      my_reports_card: 'मेरी रिपोर्ट',
      community_reports_card: 'सामुदायिक रिपोर्ट',
      leaderboard_card: 'लीडरबोर्ड',
      drafts_card: 'ड्राफ्ट', // <--- ADDED KEY FOR HOMESCREEN CARD CONSISTENCY
      logout_button: 'लॉग आउट',
      logged_in_as: 'के रूप में लॉग इन किया गया है',
      permission_required_title: 'अनुमति आवश्यक है',
      location_permission_message: 'आस-पास की रिपोर्टें दिखाने के लिए स्थान तक पहुंच की आवश्यकता है।',

      // ReportIssue Screen
      report_issue: {
        "title": "एक नई रिपोर्ट दर्ज करें",
        "section_photo": "1. एक तस्वीर जोड़ें",
        "choose_gallery": "गैलरी से चुनें",
        "take_photo": "तस्वीर लें",
        "section_details": "2. विवरण प्रदान करें",
        "select_department": "विभाग चुनें...",
        "description_placeholder": "मुद्दे का विस्तार से वर्णन करें...",
        "play_audio": "ऑडियो चलाएं",
        "section_location": "3. स्थान निर्धारित करें",
        "use_current_location": "वर्तमान स्थान का उपयोग करें",
        "select_on_map": "मानचित्र पर चुनें",
        "location_selected": "स्थान चुना गया: {{latitude}}, {{longitude}}",
        "submit_report": "रिपोर्ट जमा करें",
        "save_draft": "ड्राफ्ट सहेजें", // <--- ADDED KEY
        "alert_draft_saved": "ड्राफ्ट सफलतापूर्वक सहेजा गया!", // <--- ADDED KEY
        "confirm_location": "स्थान की पुष्टि करें",
        "cancel": "रद्द करें",
        "alert_permission_required": "अनुमति आवश्यक है",
        "alert_camera_access_needed": "तस्वीर लेने के लिए कैमरा एक्सेस की आवश्यकता है।",
        "alert_location_access_needed_get": "आपकी वर्तमान स्थिति प्राप्त करने के लिए स्थान एक्सेस की आवश्यकता है।",
        "alert_audio_access_needed": "ऑडियो रिकॉर्डिंग एक्सेस की आवश्यकता है।",
        "alert_recording_title": "रिकॉर्डिंग",
        "alert_recording_started_message": "रिकॉर्डिंग शुरू हो गई है। समाप्त करने के लिए स्टॉप आइकन पर टैप करें।",
        "alert_recording_saved_title": "रिकॉर्डिंग सहेजी गई",
        "alert_recording_saved_message": "ऑडियो रिकॉर्डिंग सहेजी गई है।",
        "alert_no_audio_title": "कोई ऑडियो नहीं",
        "alert_no_audio_message": "चलाने के लिए कोई रिकॉर्ड किया गया ऑडियो नहीं है।",
        "alert_playback_error_title": "प्लेबैक त्रुटि",
        "alert_playback_error_message": "रिकॉर्ड किया गया ऑडियो चलाने में विफल। अनुमतियां और फ़ाइल एक्सेस की जांच करें।",
        "alert_recording_deleted_title": "रिकॉर्डिंग हटाई गई",
        "alert_recording_deleted_message": "रिकॉर्ड किया गया ऑडियो हटा दिया गया है।",
        "alert_wait_title": "कृपया प्रतीक्षा करें",
        "alert_stop_recording_first_message": "कृपया पहले ऑडियो रिकॉर्डिंग रोकें।",
        "alert_missing_info_title": "जानकारी गुम है",
        "alert_missing_info_message": "कृपया एक तस्वीर, विभाग, विवरण और स्थान सहित सभी फ़ील्ड भरें।",
        "alert_submission_error_title": "जमा करने में त्रुटि",
        "alert_unknown_error_message": "एक अज्ञात त्रुटि हुई।",
        "alert_failed_to_start_recording": "रिकॉर्डिंग शुरू करने में विफल। कृपया पुनः प्रयास करें।",
        "alert_failed_to_stop_recording": "रिकॉर्डिंग रोकने में विफल। कृपया पुनः प्रयास करें।",
        "supabase_notification_title": "रिपोर्ट जमा की गई",
        "supabase_notification_body": "आपकी रिपोर्ट \"{{description}}\" सफलतापूर्वक जमा की गई है।"
      },
      // Community Reports Screen
      community_reports_title: "सामुदायिक रिपोर्ट",
      all_departments: "सभी विभाग",
      upvote_button: "अपवोट",
      upvotes: "अपवोट: {{count}}",
      upvote_sync_error: "आपका अपवोट सिंक करने में विफल रहा। कृपया पुनः प्रयास करें।",
      action_not_allowed: "अनुमति नहीं है",
      cannot_upvote_own_report: "आप अपनी खुद की रिपोर्ट को अपवोट नहीं कर सकते।",
      login_to_upvote: "रिपोर्ट को अपवोट करने के लिए कृपया लॉगिन करें।",
      // New Filter/Sort Keys for Community Reports
      search_by_description_placeholder: "विवरण द्वारा खोजें...",
      filter_reports_title: "रिपोर्ट फ़िल्टर करें",
      all_status: "सभी स्थितियाँ",
      department_label: "विभाग",
      date_range_label: "दिनांक सीमा",
      all_time: "हर समय",
      this_week: "इस सप्ताह",
      this_month: "इस महीने",
      sort_by_label: "इसके अनुसार क्रमबद्ध करें",
      newest_first: "नवीनतम पहले",
      most_upvoted: "सबसे अधिक अपवोट किया गया",
      clear_filters_button: "फ़िल्टर साफ़ करें",
      apply_button: "लागू करें",
      no_community_reports_found: "कोई रिपोर्ट नहीं मिली।",
      fetch_community_reports_error: "सामुदायिक रिपोर्ट प्राप्त नहीं की जा सकी।",
//DraftsScreen
drafts: {
      "title": "सहेजे गए ड्राफ्ट",
      "no_description": "कोई विवरण नहीं",
      "saved_at": "सहेजा गया: {{time}}",
      "edit_continue": "✏️ संपादित करें और जारी रखें",
      "delete_button": "🗑 हटाएं",
      "delete_title": "ड्राफ्ट हटाएं",
      "delete_message": "क्या आप वाकई इस ड्राफ्ट को स्थायी रूप से हटाना चाहते हैं?",
      "delete_error": "ड्राफ्ट हटाया नहीं जा सका।",
      "load_error": "ड्राफ्ट लोड नहीं किए जा सके।",
      "empty": "आपके पास कोई सहेजा हुआ ड्राफ्ट नहीं है।"
    },
    },
  },
};

// Language detector to get the saved language from AsyncStorage
const languageDetector = {
  type: 'languageDetector',
  async: true,
  init: () => {},
  async detect(callback: (language: string) => void) {
    try {
      const language = await AsyncStorage.getItem('@language');
      if (language) {
        return callback(language);
      }
    } catch (error) {
      console.error("Failed to load language from AsyncStorage", error);
    }
    callback('en'); // Fallback
  },
  async cacheUserLanguage(language: string) {
    try {
      await AsyncStorage.setItem('@language', language);
    } catch (error) {
      console.error("Failed to save language to AsyncStorage", error);
    }
  },
};

i18next
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(languageDetector as any) // Use the custom language detector
  .init({
    resources: {
      en: {
        translation: translations.en.translation,
        drafts: translations.en.drafts, // Explicitly declare drafts namespace
      },
      hi: {
        translation: translations.hi.translation,
        drafts: translations.hi.drafts, // Explicitly declare drafts namespace
      },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    compatibilityJSON: 'v3', // Required for some older Android devices
  });

export const setLanguage = async (locale: 'en' | 'hi') => {
  i18next.changeLanguage(locale);
  await AsyncStorage.setItem('@language', locale);

  const { data: { session } } = await supabase.auth.getSession();
  if (session && session.user) {
    // We use the 'users' table and 'user_id' column as defined in your provided SQL
    const { error } = await supabase
      .from('users')
      .update({ language_code: locale })
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error updating user language in Supabase:', error);
    } else {
      console.log('User language updated successfully in Supabase.');
    }
  } else {
    console.warn('User not authenticated, cannot save language to Supabase.');
  }
};

export default i18next;
