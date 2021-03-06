// Copyright Schulich Racing, FSAE
// Written by Justin Tijunelis

import React, { useContext, useEffect, useState } from "react";
import { DashboardContext } from "pages/dashboard/dashboard";
import { UserCard } from "../cards";
import { CircularProgress } from "@mui/material";
import {
  InputField,
  Alert,
  DropDown,
  TextButton,
  ToolTip,
  IconButton,
} from "components/interface";
import { CachedOutlined } from "@mui/icons-material";
import { User, UserRole } from "state";
import { getUsers } from "crud";
import { DashboardLoading } from "pages/dashboard/loading";
import DashNav from "components/navigation/dashNav";
import { useWindowSize } from "hooks";

export const ManageUsers: React.FC = () => {
  const size = useWindowSize();
  const context = useContext(DashboardContext);
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [query, setQuery] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [userCards, setUserCards] = useState<any[]>([]);
  const [error, setError] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(true);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertDescription, setAlertDescription] = useState<string>("");

  useEffect(() => fetchUsers(), []);
  useEffect(() => onSearch(query), [query]);
  useEffect(() => onSearch(query), [users]);

  useEffect(() => {
    if (roleFilter === "All") {
      generateUserCards(users);
    } else {
      let filteredUsers = [];
      for (const user of users)
        if (user.role === roleFilter) filteredUsers.push(user);
      generateUserCards(filteredUsers);
    }
  }, [roleFilter]);

  const fetchUsers = () => {
    setFetching(true);
    setError(false);
    getUsers()
      .then((users: User[]) => {
        users.sort((a: User, b: User) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
        setUsers(users);
        setFetching(false);
      })
      .catch((_: any) => {
        setFetching(false);
        setError(true);
      });
  };

  const alert = (description: string) => {
    setAlertDescription(description);
    setShowAlert(true);
  };

  const generateUserCards = (users: User[]) => {
    let cards = [];
    let adminCount = 0;
    for (const user of users) if (user.role === "Admin") adminCount++;
    for (const user of users) {
      cards.push(
        <UserCard
          user={user}
          key={user._id}
          onUserDelete={onDeleteUser}
          onUserRoleChange={onUserRoleChange}
          onlyAdmin={adminCount === 1 && user.role === UserRole.ADMIN}
        />
      );
    }
    setUserCards(cards);
  };

  const onDeleteUser = (userId: string) => {
    let updatedUsers = [];
    for (let user of [...users])
      if (user._id !== userId) updatedUsers.push(user);
    setUsers(updatedUsers);
    alert("The User was deleted.");
  };

  const onUserRoleChange = (user: User) => {
    if (user && user._id) {
      let updatedUsers = [...users];
      for (let i in updatedUsers) {
        if (updatedUsers[i]._id === user._id) {
          updatedUsers[i] = user;
        }
      }
      setUsers(updatedUsers);
      alert("The user's role was updated.");
    }
  };

  const onSearch = (query: string) => {
    let matchingUsers = [];
    let lowerQuery = query.toLowerCase().trim();
    for (let user of [...users]) {
      if (
        user.name.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
      ) {
        matchingUsers.push(user);
      }
    }
    generateUserCards(matchingUsers);
  };

  return (
    <>
      {error || fetching ? (
        <DashboardLoading>
          {fetching ? (
            <>
              <CircularProgress style={{ color: "black" }} />
              <br />
              <br />
              <b>Fetching Users...</b>
            </>
          ) : (
            <>
              <b>{error && "Could not fetch users."}</b>
              {error && (
                <TextButton title="Try Again" onClick={() => fetchUsers()} />
              )}
            </>
          )}
        </DashboardLoading>
      ) : (
        <div>
          <DashNav margin={context.margin}>
            <div className="left">
              {size.width >= 916 ? (
                <ToolTip value="Refresh">
                  <IconButton
                    img={<CachedOutlined />}
                    onClick={() => fetchUsers()}
                  />
                </ToolTip>
              ) : (
                <TextButton title="Refresh" onClick={() => fetchUsers()} />
              )}
            </div>
            <div className="right">
              <DropDown
                placeholder="Filter by Role..."
                options={[
                  { value: "All", label: "All (Role Filter)" },
                  { value: "Admin", label: "Admin (Role Filter)" },
                  { value: "Lead", label: "Lead (Role Filter)" },
                  { value: "Member", label: "Member (Role Filter)" },
                  { value: "Guest", label: "Guest (Role Filter)" },
                  { value: "Pending", label: "Pending (Role Filter)" },
                ]}
                onChange={(value: any) => setRoleFilter(value.value)}
                defaultValue={{ value: "All", label: "All (Role Filter)" }}
                isSearchable
              />
              <InputField
                name="search"
                type="name"
                placeholder="Search..."
                value={query}
                onChange={(e: any) => setQuery(e.target.value)}
                required
              />
            </div>
          </DashNav>
          <div id="manage-grid">{userCards}</div>
        </div>
      )}
      {userCards.length === 0 && (
        <div id="centered">
          <div id="centered-content">
            <b>No matching Users found...</b>
          </div>
        </div>
      )}
      <Alert
        title="Success!"
        description={alertDescription}
        color="green"
        onDismiss={() => setShowAlert(false)}
        show={showAlert}
        slideOut
      />
    </>
  );
};
