// Copyright Schulich Racing, FSAE
// Written by Joey Van Lierop, Justin Tijunelis

import React, { useState, useEffect, useContext } from "react";
import { DashboardContext } from "pages/dashboard/dashboard";
import DashNav from "components/navigation/dashNav";
import {
  isAuthAtLeast,
  RootState,
  Sensor,
  Thing,
  useAppSelector,
  UserRole,
} from "state";
import { SensorCard } from "../cards";
import { getThings, getSensors } from "crud";
import { CircularProgress } from "@mui/material";
import {
  TextButton,
  InputField,
  Alert,
  ToolTip,
  IconButton,
  DropDown,
} from "components/interface";
import { DashboardLoading } from "pages/dashboard/loading";
import { Add, CachedOutlined } from "@mui/icons-material";
import { SensorModal } from "../modals/sensorModal";
import { useWindowSize } from "hooks";

export const ManageSensors: React.FC = () => {
  const size = useWindowSize();
  const context = useContext(DashboardContext);
  const user = useAppSelector((state: RootState) => state.user);
  const [query, setQuery] = useState<string>("");
  const [thing, setThing] = useState<Thing>();
  const [things, setThings] = useState<Thing[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [sensorCards, setSensorCards] = useState<any>([]);
  const [errorFetchingThings, setErrorFetchingThings] =
    useState<boolean>(false);
  const [errorFetchingSensors, setErrorFetchingSensors] =
    useState<boolean>(false);
  const [fetchingThings, setFetchingThings] = useState<boolean>(true);
  const [fetchingSensors, setFetchingSensors] = useState<boolean>(false);
  const [noThings, setNoThings] = useState<boolean>(false);
  const [noSensors, setNoSensors] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [errorAlert, setErrorAlert] = useState<boolean>(false);
  const [alertDescription, setAlertDescription] = useState<string>("");
  const [showSensorModal, setShowSensorModal] = useState<boolean>(false);

  useEffect(() => fetchThings(), []);
  useEffect(() => onSearch(query), [query]);
  useEffect(() => fetchSensors(), [thing]);
  useEffect(() => onSearch(query), [sensors]);

  const fetchThings = () => {
    setFetchingThings(true);
    setErrorFetchingThings(false);
    getThings()
      .then((things: Thing[]) => {
        things.sort((a: Thing, b: Thing) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
        if (things.length === 1) setThing(things[0]);
        setThings(things);
        setNoThings(things.length === 0);
        setFetchingThings(false);
      })
      .catch((_: any) => {
        setFetchingThings(false);
        setErrorFetchingThings(true);
      });
  };

  const fetchSensors = () => {
    if (thing) {
      setFetchingSensors(true);
      setErrorFetchingSensors(false);
      getSensors(thing?._id)
        .then((sensors: Sensor[]) => {
          sensors.sort((a: Sensor, b: Sensor) =>
            a.name.toLowerCase().localeCompare(b.name.toLowerCase())
          );
          setSensors(sensors);
          setNoSensors(sensors.length === 0);
          setFetchingSensors(false);
        })
        .catch((_: any) => {
          setFetchingSensors(false);
          setErrorFetchingSensors(true);
        });
    }
  };

  const alert = (error: boolean, description: string) => {
    setAlertDescription(description);
    setErrorAlert(error);
    setShowAlert(true);
  };

  const generateSensorCards = (sensors: Sensor[]) => {
    let cards = [];
    for (const sensor of sensors) {
      cards.push(
        <SensorCard
          sensor={sensor}
          key={sensor._id}
          onSensorUpdate={onNewSensor}
          onSensorDelete={onDeleteSensor}
          thing={thing!}
        />
      );
    }
    setSensorCards(cards);
  };

  const onNewSensor = (sensor: Sensor) => {
    if (sensor && sensor._id) {
      let updatedSensors = [...sensors];
      let updated = false;
      for (let i in updatedSensors) {
        if (updatedSensors[i]._id === sensor._id) {
          updatedSensors[i] = sensor;
          updated = true;
        }
      }
      if (!updated) updatedSensors.push(sensor);
      updatedSensors.sort((a: Sensor, b: Sensor) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
      setSensors(updatedSensors);
      setNoSensors(false);
      if (updated) alert(false, "The Sensor was updated.");
      else alert(false, "The Sensor was created.");
    }
    setShowSensorModal(false);
  };

  const onDeleteSensor = (sensorId: string) => {
    let updatedSensors = [];
    for (let sensor of [...sensors]) {
      if (sensor._id !== sensorId) {
        updatedSensors.push(sensor);
      }
    }
    setSensors(updatedSensors);
    setNoSensors(updatedSensors.length === 0);
    alert(false, "The Sensor was deleted.");
  };

  const onSearch = (query: string) => {
    let matchingSensors = [];
    let lowerQuery = query.toLowerCase().trim();
    for (let sensor of [...sensors])
      if (sensor.name.toLowerCase().includes(lowerQuery))
        matchingSensors.push(sensor);
    generateSensorCards(matchingSensors);
  };

  return (
    <>
      {noThings ||
      noSensors ||
      errorFetchingThings ||
      errorFetchingSensors ||
      fetchingThings ||
      fetchingSensors ? (
        <DashboardLoading>
          {fetchingThings || fetchingSensors ? (
            <>
              <CircularProgress style={{ color: "black" }} />
              <br />
              <br />
              <b>Fetching&nbsp;{fetchingThings ? "Things" : "Sensors"}...</b>
            </>
          ) : (
            <>
              <b>
                {!thing && (
                  <>
                    {!errorFetchingThings
                      ? "Your organization has no Things yet. You can create one on the Thing page."
                      : "Could not fetch Things."}
                    {errorFetchingThings && (
                      <TextButton
                        title="Try Again"
                        onClick={() => fetchThings()}
                      />
                    )}
                  </>
                )}
                {thing && (
                  <>
                    {!errorFetchingSensors && thing
                      ? "The Thing has no Sensors yet."
                      : "Could not fetch Sensors."}
                    {errorFetchingSensors && (
                      <TextButton
                        title="Try Again"
                        onClick={() => fetchSensors()}
                      />
                    )}
                  </>
                )}
              </b>
              {!errorFetchingSensors &&
                thing &&
                isAuthAtLeast(user, UserRole.ADMIN) && (
                  <TextButton
                    title="Create a new Sensor"
                    onClick={() => setShowSensorModal(true)}
                  />
                )}
              {!errorFetchingSensors && thing && (
                <>
                  <br />
                  <br />
                  <b>Select a different Thing:</b>
                  <br />
                  <br />
                  <DropDown
                    placeholder="Select Thing..."
                    options={things.map((thing) => {
                      return { value: thing._id, label: thing.name };
                    })}
                    onChange={(value: any) => {
                      for (const thing of things)
                        if (thing._id === value.value) setThing(thing);
                    }}
                    defaultValue={{ value: thing._id, label: thing.name }}
                    isSearchable
                  />
                </>
              )}
            </>
          )}
        </DashboardLoading>
      ) : (
        <div>
          {thing ? (
            <>
              <DashNav margin={context.margin}>
                <div className="left">
                  {size.width >= 916 ? (
                    <ToolTip value="Refresh">
                      <IconButton
                        img={<CachedOutlined />}
                        onClick={() => fetchSensors()}
                      />
                    </ToolTip>
                  ) : (
                    <TextButton
                      title="Refresh"
                      onClick={() => fetchSensors()}
                    />
                  )}
                  {size.width >= 916 ? (
                    <ToolTip value="New Sensor">
                      <IconButton
                        onClick={() => {
                          if (sensors.length === 256)
                            alert(
                              true,
                              "Each thing can only have 256 sensors."
                            );
                          else setShowSensorModal(true);
                        }}
                        img={<Add />}
                        disabled={!isAuthAtLeast(user, UserRole.ADMIN)}
                      />
                    </ToolTip>
                  ) : (
                    <TextButton
                      title="New Sensor"
                      onClick={() => {
                        if (sensors.length === 256)
                          alert(true, "Each thing can only have 256 sensors.");
                        else setShowSensorModal(true);
                      }}
                      disabled={!isAuthAtLeast(user, UserRole.ADMIN)}
                    />
                  )}
                </div>
                <div className="right">
                  <DropDown
                    placeholder="Select Thing..."
                    options={things.map((thing) => {
                      return { value: thing._id, label: thing.name };
                    })}
                    onChange={(value: any) => {
                      for (const thing of things)
                        if (thing._id === value.value) setThing(thing);
                    }}
                    defaultValue={{ value: thing._id, label: thing.name }}
                    isSearchable
                  />
                  <InputField
                    name="search"
                    type="name"
                    placeholder="Search"
                    value={query}
                    onChange={(e: any) => setQuery(e.target.value)}
                    required
                  />
                </div>
              </DashNav>
              <div id="manage-grid">{sensorCards}</div>
            </>
          ) : (
            <DashboardLoading>
              <b>Select the Thing you want Sensors for:</b>
              <br />
              <br />
              <DropDown
                placeholder="Select Thing..."
                options={things.map((thing) => {
                  return { value: thing._id, label: thing.name };
                })}
                onChange={(value: any) => {
                  for (const thing of things)
                    if (thing._id === value.value) setThing(thing);
                }}
                isSearchable
              />
            </DashboardLoading>
          )}
        </div>
      )}
      {sensorCards.length === 0 && (
        <div id="centered">
          <div id="centered-content">
            <b>No matching Sensors found...</b>
          </div>
        </div>
      )}
      {showSensorModal && (
        <SensorModal
          show={showSensorModal}
          toggle={onNewSensor}
          thing={thing!}
        />
      )}
      <Alert
        title="Success!"
        description={alertDescription}
        color={errorAlert ? "red" : "green"}
        onDismiss={() => setShowAlert(false)}
        show={showAlert}
        slideOut
      />
    </>
  );
};
