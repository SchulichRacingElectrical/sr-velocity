// Copyright Schulich Racing FSAE
// Written by Ryan Painchaud, Justin Tijunelis

import React, { useEffect, useState } from "react";
import Sidebar from "components/navigation/sidebar";
import Streaming from "./streaming/streaming";
import Historical from "./historical/historical";
import Manage from "./manage/manage";
import { useWindowSize } from "hooks/";
import { useSwipeable } from "react-swipeable";
import { useAppSelector, RootState } from "state";
import { getThings } from "crud";
import { Thing } from "state";
import "./_styling/dashboard.css";

export const DashboardContext = React.createContext({
  page: "",
  margin: 0,
});

const Dashboard: React.FC = () => {
  const [sideBarToggled, setSideBarToggled] = useState(false);
  const [sideBarCollapsed, setSideBarCollapsed] = useState(false);
  const dashboard = useAppSelector((state: RootState) => state.dashboard);
  const gestures = useSwipeable({
    onSwipedRight: (_) => size.width <= 768.9 && setSideBarToggled(true),
    onSwipedLeft: (_) => size.width <= 768.9 && setSideBarToggled(false),
    trackMouse: true,
  });
  const size = useWindowSize();

  useEffect(() => {
    getThings()
      .then((things: Thing[]) => {
        // Update redux dashboard
        // Prompt the user to select a thing
        // Don't allow the user to exit without selecting a thing
        // Handle case where there are no things
      })
      .catch((_: any) => {
        // Could not fetch things, fuck!
      });
  }, []);

  useEffect(() => {
    if (size.width >= 768.9 && sideBarToggled) setSideBarToggled(false);
  }, [size.width]);

  return (
    <div id="dashboard" {...gestures}>
      <Sidebar toggled={sideBarToggled} onCollapse={setSideBarCollapsed} />
      <div
        id="content"
        style={{
          marginLeft: size.width >= 768.9 ? (!sideBarCollapsed ? 76 : 220) : 0,
        }}
      >
        <DashboardContext.Provider
          value={{
            page: dashboard!.page,
            margin: size.width >= 768.9 ? (!sideBarCollapsed ? 76 : 220) : 0,
          }}
        >
          <Streaming />
          <Historical />
          <Manage />
        </DashboardContext.Provider>
      </div>
    </div>
  );
};

export default Dashboard;
