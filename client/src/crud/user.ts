// Copyright Schulich Racing, FSAE
// Written by Justin Tijunelis

import { User } from "state";
import { request } from "./request";

export const signIn = (credentials: any) => {
  return new Promise<User>((resolve, reject) => {
    request("POST", "/auth/login", credentials)
      .then((res: any) => resolve(res.data))
      .catch((err: any) => reject(err));
  });
};

export const registerUser = (credentials: any) => {
  return new Promise<void>((resolve, reject) => {
    request("POST", "/auth/signup", credentials)
      .then((_: any) => resolve())
      .catch((err: any) => reject(err));
  });
};

export const signUserOut = () => {
  return new Promise<void>((resolve, reject) => {
    request("POST", "/auth/signout")
      .then((_: any) => resolve())
      .catch((err: any) => reject(err));
  });
};

export const putUser = (user: User) => {
  return new Promise<void>((resolve, reject) => {});
};

export const deleteUser = (userId: string) => {
  return new Promise<void>((resolve, reject) => {});
};

export const approveUser = (userId: string) => {
  return new Promise<void>((resolve, reject) => {});
};

export const classifyUser = (user: User) => {
  return new Promise<void>((resolve, reject) => {});
};
