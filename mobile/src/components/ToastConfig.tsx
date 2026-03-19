import { ErrorToast, InfoToast, SuccessToast } from "toastify-react-native";
import ToastManager from "toastify-react-native";

const TOAST_CONTAINER = {
  backgroundColor: "#3B3E5B",
  borderRadius: 20,
  borderWidth: 4,
  borderColor: "#12121A",
  shadowColor: "#000000",
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 8,
};

const TEXT1_STYLE = {
  color: "#ffffff",
  fontWeight: "900" as const,
  textTransform: "uppercase" as const,
  letterSpacing: 1,
  fontSize: 15,
};

const TEXT2_STYLE = {
  color: "#ffffff",
  fontWeight: "700" as const,
  fontSize: 12,
};

const toastConfig = {
  success: (props: any) => (
    <SuccessToast
      {...props}
      style={{
        ...TOAST_CONTAINER,
        borderLeftColor: "#8B5CF6",
        borderLeftWidth: 5,
      }}
      text1Style={TEXT1_STYLE}
      text2Style={TEXT2_STYLE}
      textColor="#fff"
      contentContainerStyle={{ paddingHorizontal: 16 }}
      showCloseIcon={false}
      showProgressBar={false}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        ...TOAST_CONTAINER,
        borderLeftColor: "#8B5CF6",
        borderLeftWidth: 5,
      }}
      text1Style={TEXT1_STYLE}
      text2Style={TEXT2_STYLE}
      textColor="#fff"
      contentContainerStyle={{ paddingHorizontal: 16 }}
      showCloseIcon={false}
      showProgressBar={false}
    />
  ),
  info: (props: any) => (
    <InfoToast
      {...props}
      style={{
        ...TOAST_CONTAINER,
        borderLeftColor: "#8B5CF6",
        borderLeftWidth: 5,
      }}
      text1Style={TEXT1_STYLE}
      text2Style={TEXT2_STYLE}
      textColor="#fff"
      contentContainerStyle={{ paddingHorizontal: 16 }}
      showCloseIcon={false}
      showProgressBar={false}
    />
  ),
};

export function AppToastHost() {
  return (
    <ToastManager
      config={toastConfig}
      minHeight={70}
      duration={3000}
      iconSize={20}
      textStyle={{ fontSize: 12, color: "#fff" }}
    />
  );
}
