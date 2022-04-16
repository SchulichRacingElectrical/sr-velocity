// Copyright Schulich Racing FSAE
// Written by Jeremy Bilic, Justin Tijunelis

import React, { useState } from "react";
import { RootState, useAppSelector, userSignedIn, useAppDispatch } from "state";
import { useForm } from "hooks";
import { InputField, TextButton, Alert } from "components/interface/";
import { signUserOut, putUser } from "crud";
import { useDispatch } from "react-redux";
import { bindActionCreators } from "redux";
import "./_styling/profile.css";

// TODO: Add change password functionality
// TODO: Show some organization information

const Profile: React.FC = () => {
  const user = useAppSelector((state: RootState) => state.user);
  const setUser = bindActionCreators(userSignedIn, useAppDispatch());
  const dispatch = useDispatch();

  const [values, handleChange] = useForm({ ...user });
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertColor, setAlertColor] = useState<string>("");
  const [alertTitle, setAlertTitle] = useState<string>("");
  const [alertDescription, setAlertDescription] = useState<string>("");

  const alert = (error: boolean, description: string) => {
    // Could this be a hook instead?
    if (error) setAlertTitle("Something went wrong...");
    else setAlertTitle("Success!");
    setAlertColor(error ? "red" : "green");
    setAlertDescription(description);
    setShowAlert(true);
  };

  const onSubmit = (event: any) => {
    event?.preventDefault();
    putUser(values)
      .then((_: any) => {
        setUser(values);
        alert(false, "Your profile was updated!");
      })
      .catch((_: any) => alert(true, "Please try again..."));
  };

  const signOut = () => {
    signUserOut()
      .then((_: any) => {
        dispatch({ type: "RESET" });
        window.location.href = "/";
      })
      .catch((_: any) => alert(true, "Please try again..."));
  };

  return (
    <div className="page-content" id="profile">
      <div id="profile-content">
        <form id="sign-in-form" onSubmit={onSubmit}>
          <img src="assets/team-logo.svg" />
          <InputField
            name="name"
            type="name"
            title="Display Name"
            value={values.name}
            onChange={handleChange}
            required
          />
          <InputField
            name="email"
            type="email"
            title="Email"
            value={values.email}
            onChange={handleChange}
            required
          />
          <TextButton title="Update" />
          <TextButton type="button" title="Change Password" />
          <TextButton type="button" title="Sign Out" onClick={signOut} />
        </form>
      </div>
      <Alert
        title={alertTitle}
        description={alertDescription}
        color={alertColor}
        onDismiss={() => setShowAlert(false)}
        show={showAlert}
        slideOut
      />
    </div>
  );
};

export default Profile;
