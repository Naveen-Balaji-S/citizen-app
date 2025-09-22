import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the translation keys and their values for English and Hindi
const translations = {
  en: {
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

    // Register Screen
    register_title: 'Create an Account',
    register_button: 'Register',
    login_prompt: 'Already have an account? Login',
    registration_success_message: 'Your account has been created! Please check your email for a confirmation link to complete registration.',
    registration_failed_title: 'Registration Failed',

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
      "use_current_location": "Use Current Location",
      "select_on_map": "Select on Map",
      "location_selected": "Location selected: {{latitude}}, {{longitude}}",
      "submit_report": "Submit Report",
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
    login_to_upvote: "Please log in to upvote a report."
  },
  hi: {
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

    // Register Screen
    register_title: 'एक खाता बनाएं',
    register_button: 'रजिस्टर करें',
    login_prompt: 'पहले से ही एक खाता है? लॉगिन करें',
    registration_success_message: 'आपका खाता बनाया गया है! पंजीकरण पूरा करने के लिए कृपया अपने ईमेल में पुष्टिकरण लिंक देखें।',
    registration_failed_title: 'पंजीकरण विफल',

    // Notifications Screen
    notifications_screen_title: 'अधिसूचनाएं',

    // --- Added translations for new screens ---
    // Leaderboard Screen
    leaderboard_title: 'शीर्ष योगदानकर्ता',
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
    status_submitted: 'सबमिट किया गया',
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
    login_to_upvote: "रिपोर्ट को अपवोट करने के लिए कृपया लॉगिन करें।"
  },
};

const i18n = new I18n(translations);

export const setLanguage = async (locale: 'en' | 'hi') => {
  i18n.locale = locale;
  await AsyncStorage.setItem('@language', locale);
};

export const getSavedLanguage = async () => {
  const savedLanguage = await AsyncStorage.getItem('@language');
  if (savedLanguage) {
    i18n.locale = savedLanguage;
  }
  return savedLanguage;
};

// Default locale and fallback
i18n.locale = 'en';
i18n.enableFallback = true;

export default i18n;
