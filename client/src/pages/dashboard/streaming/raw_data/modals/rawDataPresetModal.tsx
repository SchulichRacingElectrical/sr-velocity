// Copyright Schulich Racing FSAE
// Written by Justin Tijunelis

import React, { useEffect, useState } from "react";
import { BaseModal } from "components/modals";
import {
  InputField,
  TextButton,
  Alert,
  MultiSelect,
} from "components/interface";
import { RawDataPreset, Sensor, Thing } from "state";
import { postRawDataPreset, putRawDataPreset } from "crud";
import { useForm } from "hooks";

interface RawDataPresetModalProps {
  show: boolean;
  toggle: any;
  rawDataPreset?: RawDataPreset;
  selectedSensors?: Sensor[];
  allSensors: Sensor[];
  thing: Thing;
}

export const RawDataPresetModal: React.FC<RawDataPresetModalProps> = (
  props: RawDataPresetModalProps
) => {
  const [sensorOptions, setSensorOptions] = useState<any[]>([]);
  const [selectedSensors, setSelectedSensors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertDescription, setAlertDescription] = useState<string>("");
  const [values, handleChange] = useForm(
    props.rawDataPreset ? props.rawDataPreset : { name: "" }
  );

  useEffect(() => {
    let sensorOptions = [];
    for (const sensor of props.allSensors) {
      sensorOptions.push({ key: sensor.name, value: sensor });
    }
    setSensorOptions(sensorOptions);
    if (props.selectedSensors) {
      let selectedSensors = [];
      for (const sensor of props.selectedSensors) {
        selectedSensors.push({ key: sensor.name, value: sensor });
      }
      setSelectedSensors(selectedSensors);
    }
  }, [props.show, props.allSensors, props.selectedSensors]);

  const alert = (description: string) => {
    setAlertDescription(description);
    setShowAlert(true);
  };

  const onSubmit = (e: any) => {
    e.preventDefault();
    setLoading(true);
    if (props.rawDataPreset) {
      let preset = {
        ...values,
        sensorIds: selectedSensors.map((value) => value.value._id),
      };
      putRawDataPreset(preset)
        .then((_: any) => {
          setLoading(false);
          props.toggle(preset);
        })
        .catch((err: any) => {
          setLoading(false);
          if (err.status === 409)
            alert("The Preset name must be unique. Please try again...");
          else alert("Please try again...");
        });
    } else {
      postRawDataPreset({
        ...values,
        sensorIds: selectedSensors.map((value) => value.value._id),
        thingId: props.thing._id,
      })
        .then((preset: RawDataPreset) => {
          setLoading(false);
          props.toggle(preset);
        })
        .catch((err: any) => {
          setLoading(false);
          if (err.status === 409)
            alert("The Preset name must be unique. Please try again...");
          else alert("Please try again...");
        });
    }
  };

  const onSensorChange = (selectedList: any[], _: any[]) => {
    setSelectedSensors(selectedList);
  };

  return (
    <>
      <BaseModal
        title={
          props.rawDataPreset ? "Edit Raw Data Preset" : "New Raw Data Preset"
        }
        show={props.show}
        toggle={props.toggle}
        onSubmit={onSubmit}
        handleChange={handleChange}
      >
        <InputField
          name="name"
          title="Name"
          value={values.name}
          minLength={4}
          maxLength={20}
          required
        />
        <MultiSelect
          placeholder="Sensors"
          options={sensorOptions}
          selectedValues={selectedSensors}
          onSelect={onSensorChange}
          onRemove={onSensorChange}
        />
        <TextButton title="Save" loading={loading} />
      </BaseModal>
      <Alert
        title="Something went wrong..."
        description={alertDescription}
        color="red"
        onDismiss={() => setShowAlert(false)}
        show={showAlert}
        slideOut
      />
    </>
  );
};