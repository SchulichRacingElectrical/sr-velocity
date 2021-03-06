// Copyright Schulich Racing FSAE
// Written by Justin Tijunelis

import React, { useState, useContext, useEffect } from "react";
import {
  IconButton,
  ToolTip,
  DropDown,
  Alert,
  TextButton,
} from "components/interface";
import { DashboardContext } from "../../dashboard";
import { DashboardLoading } from "pages/dashboard/loading";
import DashNav from "components/navigation/dashNav";
import { SaveOutlined, Add } from "@mui/icons-material";
import {
  RawDataPreset,
  Sensor,
  Thing,
  isAuthAtLeast,
  RootState,
  useAppSelector,
  UserRole,
} from "state";
import { getRawDataPresets } from "crud";
import { CircularProgress } from "@mui/material";
import { NewRawBoxModal } from "./modals/newRawBoxModal";
import { RawDataPresetModal } from "./modals/rawDataPresetModal";
import RawBox from "./rawBox";
import { useWindowSize } from "hooks";
import { Stream } from "stream/stream";
import "./_styling/rawDataView.css";

interface RawDataViewProps {
  sensors: Sensor[];
  things: Thing[];
  thing: Thing;
  stream: Stream;
  onThingChange: (thing: Thing) => void;
}

const RawDataView: React.FC<RawDataViewProps> = (props: RawDataViewProps) => {
  const size = useWindowSize();
  const context = useContext(DashboardContext);
  const user = useAppSelector((state: RootState) => state.user);
  const [fetchingPresets, setFetchingPresets] = useState<boolean>(false);
  const [rawDataPreset, setRawDataPreset] = useState<RawDataPreset>();
  const [rawDataPresets, setRawDataPresets] = useState<RawDataPreset[]>([]);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertError, setAlertError] = useState<boolean>(false);
  const [alertDescription, setAlertDescription] = useState<string>("");
  const [showRawBoxModal, setShowRawBoxModal] = useState<boolean>(false);
  const [showPresetModal, setShowPresetModal] = useState<boolean>(false);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);

  useEffect(() => {
    setFetchingPresets(true);
    getRawDataPresets(props.thing._id)
      .then((presets: RawDataPreset[]) => {
        presets.sort((a: RawDataPreset, b: RawDataPreset) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
        setRawDataPresets(presets);
        setFetchingPresets(false);
      })
      .catch((_: any) => {
        alert(true, "Could not fetch presets...");
        setFetchingPresets(false);
      });
  }, []);

  useEffect(() => {
    if (rawDataPreset) {
      let sensors: Sensor[] = [];
      for (const sensorId of rawDataPreset.sensorIds) {
        let sensor = props.sensors.filter((sensor) => sensor._id === sensorId);
        if (sensor.length === 1) sensors.push(sensor[0]);
      }
      setSensors(sensors);
    } else {
      setSensors([]);
    }
  }, [rawDataPreset, props.sensors]);

  useEffect(() => {
    generateBoxes(sensors);
  }, [sensors]);

  const alert = (error: boolean, description: string) => {
    setAlertDescription(description);
    setAlertError(error);
    setShowAlert(true);
  };

  const generateBoxes = (sensors: Sensor[]) => {
    let boxes: any[] = [];
    for (const sensor of sensors) {
      boxes.push(
        <RawBox
          key={sensor._id}
          sensor={sensor}
          onDelete={onRawBoxDelete}
          stream={props.stream}
        />
      );
    }
    setBoxes(boxes);
  };

  const onNew = (newSensors: Sensor[]) => {
    if (newSensors && newSensors.length) {
      let updatedSensors = [...sensors];
      for (const sensor of newSensors) updatedSensors.push(sensor);
      updatedSensors.sort((a: Sensor, b: Sensor) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
      setSensors(updatedSensors);
      alert(
        false,
        newSensors.length > 1
          ? "New boxes were created..."
          : "New box was created..."
      );
    }
    setShowRawBoxModal(false);
  };

  const onRawBoxDelete = (sensorId: string) => {
    let updatedSensors = [];
    for (let sensor of [...sensors])
      if (sensor._id !== sensorId) updatedSensors.push(sensor);
    setSensors(updatedSensors);
  };

  const onNewPreset = (preset: RawDataPreset) => {
    if (preset && preset._id) {
      let updatedPresets = [...rawDataPresets];
      let updated = false;
      for (let i in updatedPresets) {
        if (updatedPresets[i]._id === preset._id) {
          updatedPresets[i] = preset;
          updated = true;
        }
      }
      if (!updated) updatedPresets.push(preset);
      updatedPresets.sort((a: RawDataPreset, b: RawDataPreset) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
      setRawDataPresets(updatedPresets);
      setRawDataPreset(preset);
      if (updated) alert(false, "The Preset was updated.");
      else alert(false, "The Preset was created.");
    }
    setShowPresetModal(false);
  };

  const onPresetDelete = (presetId: string) => {
    let updatedPresets = [];
    for (const preset of rawDataPresets)
      if (preset._id !== presetId) updatedPresets.push(preset);
    setRawDataPresets(updatedPresets);
    setRawDataPreset(undefined);
    alert(false, "The Preset was deleted.");
  };

  return (
    <>
      {fetchingPresets ? (
        <DashboardLoading>
          <CircularProgress style={{ color: "black" }} />
          <br />
          <br />
          <b>Fetching presets...</b>
        </DashboardLoading>
      ) : (
        <>
          <DashNav margin={context.margin}>
            <div className="left">
              {size.width >= 916 ? (
                <ToolTip value="New Box">
                  <IconButton
                    img={<Add />}
                    onClick={() => setShowRawBoxModal(true)}
                  />
                </ToolTip>
              ) : (
                <TextButton
                  title="New Box"
                  onClick={() => setShowRawBoxModal(true)}
                />
              )}
              {sensors.length > 0 && (
                <>
                  {size.width >= 916 ? (
                    <ToolTip value="Save Preset">
                      <IconButton
                        img={<SaveOutlined />}
                        onClick={() => setShowPresetModal(true)}
                        disabled={!isAuthAtLeast(user, UserRole.MEMBER)}
                      />
                    </ToolTip>
                  ) : (
                    <TextButton
                      title="Save Preset"
                      onClick={() => setShowPresetModal(true)}
                      disabled={!isAuthAtLeast(user, UserRole.MEMBER)}
                    />
                  )}
                </>
              )}
              {rawDataPresets.length !== 0 && (
                <DropDown
                  placeholder="Select Preset..."
                  options={(() => {
                    let options = [];
                    if (isAuthAtLeast(user, UserRole.MEMBER)) {
                      options.push({
                        value: undefined,
                        label: "New Preset",
                      });
                    }
                    options = options.concat(
                      // @ts-ignore
                      rawDataPresets.map((preset) => {
                        return { value: preset, label: preset.name };
                      })
                    );
                    return options;
                  })()}
                  onChange={(value: any) => {
                    setRawDataPreset(
                      value.label === "New Preset" ? undefined : value.value
                    );
                  }}
                  value={
                    rawDataPreset
                      ? { value: rawDataPreset, label: rawDataPreset.name }
                      : { value: undefined, label: "New Preset" }
                  }
                  isSearchable
                />
              )}
            </div>
            <div className="right">
              <DropDown
                placeholder="Select Thing..."
                options={props.things.map((thing) => {
                  return { value: thing._id, label: thing.name };
                })}
                onChange={(value: any) => {
                  for (const thing of props.things)
                    if (thing._id === value.value) props.onThingChange(thing);
                }}
                defaultValue={{
                  value: props.thing._id,
                  label: props.thing.name,
                }}
                isSearchable
              />
            </div>
          </DashNav>
          <div id="raw-data-boxes">{boxes}</div>
          {boxes.length === 0 && (
            <DashboardLoading>
              <b>No Sensors selected...</b>
              <br />
              <br />
              <TextButton
                title="Add Sensor(s)"
                onClick={() => setShowRawBoxModal(true)}
              />
            </DashboardLoading>
          )}
        </>
      )}
      {showRawBoxModal && (
        <NewRawBoxModal
          show={showRawBoxModal}
          toggle={onNew}
          sensors={(() => {
            let selectedSensorsIds = sensors.map((sensor) => sensor._id);
            let unselected = [];
            for (const sensor of props.sensors)
              if (!selectedSensorsIds.includes(sensor._id))
                unselected.push(sensor);
            return unselected;
          })()}
        />
      )}
      {showPresetModal && (
        <RawDataPresetModal
          show={showPresetModal}
          toggle={onNewPreset}
          rawDataPreset={(() => {
            if (rawDataPreset)
              return {
                ...rawDataPreset,
                sensorIds: sensors.map((sensor) => sensor._id),
              };
            else return undefined;
          })()}
          selectedSensors={sensors}
          allSensors={props.sensors}
          thing={props.thing}
          onDelete={onPresetDelete}
        />
      )}
      <Alert
        title={alertError ? "Something went wrong..." : "Success!"}
        description={alertDescription}
        color={alertError ? "red" : "green"}
        onDismiss={() => setShowAlert(false)}
        show={showAlert}
        slideOut
      />
    </>
  );
};

export default RawDataView;
