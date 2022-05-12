// Copyright Schulich Racing FSAE
// Written by Justin Tijunelis

import React, { useState } from "react";
import { BaseModal } from "components/modals";
import {
  InputField,
  MultiSelect,
  DropDown,
  TextButton,
  Alert,
} from "components/interface";
import { Sensor, Chart } from "state";
import { ChartType } from "components/charts";
import { useForm } from "hooks";

interface NewChartModalProps {
  show?: boolean;
  toggle: any;
  sensors: Sensor[];
}

export const NewChartModal: React.FC<NewChartModalProps> = (
  props: NewChartModalProps
) => {
  const [selectedSensors, setSelectedSensors] = useState<any[]>([]);
  const [sensorIds, setSensorIds] = useState<string[]>([]);
  const [chartType, setChartType] = useState<ChartType>();
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertDescription, setAlertDescription] = useState<string>("");
  const [values, handleChange] = useForm({ name: "" });

  const alert = (description: string) => {
    setAlertDescription(description);
    setShowAlert(true);
  };

  const onSubmit = (e: any) => {
    e.preventDefault();
    let newChart: Chart = {
      _id: "",
      name: values.name,
      type: chartType as string,
      sensorIds: sensorIds,
    };
    props.toggle(newChart);
  };

  const onSensorChange = (selectedList: any[], _: any[]) => {
    let sensorIds: string[] = [];
    for (let item of selectedList) sensorIds.push(item.value);
    if (sensorIds.length > 4 && chartType === ChartType.LINE) {
      alert("A Line chart can only have 4 or fewer sensors...");
    } else if (sensorIds.length > 2) {
      alert("A " + chartType + " can only have 2 sensors...");
    } else {
      setSelectedSensors(selectedList);
      setSensorIds(sensorIds);
    }
  };

  return (
    <>
      <BaseModal
        title="New Chart"
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
        <DropDown
          placeholder="Select Chart Type..."
          options={[
            { value: ChartType.LINE, label: ChartType.LINE },
            { value: ChartType.SCATTER, label: ChartType.SCATTER },
            { value: ChartType.RADIAL, label: ChartType.RADIAL },
            { value: ChartType.HEATMAP, label: ChartType.HEATMAP },
          ]}
          onChange={(value: any) => {
            setChartType(value.value);
            if (value.value !== ChartType.LINE) setSensorIds(["", ""]);
            else setSensorIds([]);
            setSelectedSensors([]);
          }}
          isSearchable
        />
        {chartType === ChartType.LINE && (
          <MultiSelect
            placeholder="Sensors"
            options={props.sensors.map((sensor) => {
              return { key: sensor.name, _id: sensor._id };
            })}
            selectedList={selectedSensors}
            onSelect={onSensorChange}
            onRemove={onSensorChange}
            isSearchable
          />
        )}
        {chartType && chartType !== ChartType.LINE && (
          <>
            <DropDown
              placeholder="Select X-Axis..."
              options={props.sensors.map((sensor: Sensor) => {
                return { value: sensor._id, label: sensor.name };
              })}
              onChange={(value: any) => {
                let ids = { ...sensorIds };
                ids[0] = value.value;
                setSensorIds(ids);
              }}
              isSearchable
            />
            <DropDown
              placeholder="Select Y-Axis..."
              options={props.sensors.map((sensor: Sensor) => {
                return { value: sensor._id, label: sensor.name };
              })}
              onChange={(value: any) => {
                let ids = { ...sensorIds };
                ids[1] = value.value;
                setSensorIds(ids);
              }}
              isSearchable
            />
          </>
        )}
        <TextButton title="Save" />
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