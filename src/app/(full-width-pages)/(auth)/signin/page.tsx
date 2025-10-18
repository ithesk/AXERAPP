import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AXER GESTION -REPARACION",
  description: "AXER GESTION -REPARACION ",
};

export default function SignIn() {
  return <SignInForm />;
}
