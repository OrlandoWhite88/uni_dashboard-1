
import React, { useEffect } from "react";
import { RedirectToSignIn } from "@clerk/clerk-react";

const SignInPage = () => {
  // This page now simply redirects to the Clerk hosted sign-in page
  return <RedirectToSignIn redirectUrl="/" />;
};

export default SignInPage;
