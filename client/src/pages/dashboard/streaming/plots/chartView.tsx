// Copyright Schulich Racing FSAE
// Written by Justin Tijunelis

import React, { useState, useEffect, useContext, useRef } from "react";
import { ChartBox, ChartBoxType } from "components/charts/chartBox";
import { DashboardContext } from "../../dashboard";
import { SaveOutlined, Add, CachedOutlined } from "@mui/icons-material";
import { DashboardLoading } from "pages/dashboard/loading";
import {
  IconButton,
  ToolTip,
  DropDown,
  Alert,
  TextButton,
} from "components/interface";
import {
  Sensor,
  Thing,
  Chart,
  ChartPreset,
  useAppSelector,
  RootState,
  isAuthAtLeast,
  UserRole,
} from "state";
import { getChartPresets } from "crud";
import { ChartModal } from "components/modals";
import { CircularProgress } from "@mui/material";
import DashNav from "components/navigation/dashNav";
import { useWindowSize } from "hooks";
import { ChartPresetModal } from "../../../../components/modals/chartPresetModal";
import { requestMissingData } from "crud";
import { Stream } from "stream/stream";
import "./chartView.css";

interface ChartViewProps {
  sensors: Sensor[];
  things: Thing[];
  thing: Thing;
  stream: Stream;
  onThingChange: (thing: Thing) => void;
}

const ChartView: React.FC<ChartViewProps> = (props: ChartViewProps) => {
  const size = useWindowSize();
  const context = useContext(DashboardContext);
  const user = useAppSelector((state: RootState) => state.user);

  // Subscriptions
  const connectionCallback = useRef<() => void>(null);
  const stopCallback = useRef<() => void>(null);

  // State
  const [streaming, setStreaming] = useState<boolean>(
    props.stream.isStreaming()
  );
  const [fetchingMissingData, setFetchingMissingData] =
    useState<boolean>(false);
  const [fetchingPresets, setFetchingPresets] = useState<boolean>(true);
  const [chartPreset, setChartPreset] = useState<ChartPreset>();
  const [chartPresets, setChartPresets] = useState<ChartPreset[]>([]);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertError, setAlertError] = useState<boolean>(false);
  const [alertDescription, setAlertDescription] = useState<string>("");
  const [showChartModal, setShowChartModal] = useState<boolean>(false);
  const [showPresetModal, setShowPresetModal] = useState<boolean>(false);
  const [charts, setCharts] = useState<Chart[]>([]);
  const [chartUI, setChartUI] = useState<any[]>([]);

  useEffect(() => {
    setFetchingPresets(true);
    getChartPresets(props.thing._id)
      .then((presets: ChartPreset[]) => {
        presets.sort((a: ChartPreset, b: ChartPreset) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
        setChartPresets(presets);
        setFetchingPresets(false);
      })
      .catch((_: any) => {
        alert(true, "Could not fetch presets...");
        setFetchingPresets(false);
      });
    // @ts-ignore
    connectionCallback.current = onConnection; // @ts-ignore
    stopCallback.current = onStop;
    const connectionSubId =
      props.stream.subscribeToConnection(connectionCallback);
    const stopSubId = props.stream.subscribeToStop(stopCallback);
    return () => {
      props.stream.unsubscribeFromConnection(connectionSubId);
      props.stream.unsubscribeFromStop(stopSubId);
    };
  }, []);

  useEffect(() => {
    if (chartPreset) {
      let changed = false;
      if (charts.length === chartPreset.charts.length) {
        for (const chart of charts) {
          if (
            chartPreset.charts.filter((c) => c._id === chart._id).length === 0
          ) {
            changed = false;
          }
        }
      } else {
        setCharts(chartPreset ? chartPreset.charts : []);
      }
      if (changed) setCharts(chartPreset.charts);
    } else {
      setCharts([]);
    }
  }, [chartPreset]);

  useEffect(() => {
    generateCharts(charts);
  }, [charts]);

  const alert = (error: boolean, description: string) => {
    setAlertDescription(description);
    setAlertError(error);
    setShowAlert(true);
  };

  const generateCharts = (charts: Chart[]) => {
    let chartUI: any = [];
    for (const chart of charts) {
      let sensors: Sensor[] = [];
      for (const id of chart.sensorIds)
        sensors.push(props.sensors.filter((s) => s._id === id)[0]);
      chartUI.push(
        <ChartBox
          key={chart._id}
          chart={chart}
          allSensors={props.sensors}
          sensors={sensors}
          stream={props.stream}
          onDelete={onDeleteChart}
          onUpdate={onChartUpdate}
          charts={charts}
          type={ChartBoxType.DYNAMIC}
        />
      );
    }
    setChartUI(chartUI);
  };

  const onChartUpdate = (chart: Chart) => {
    if (chart && chart._id) {
      let updatedCharts = [...charts];
      let updated = false;
      for (let i in updatedCharts) {
        if (updatedCharts[i]._id === chart._id) {
          updatedCharts[i] = chart;
          updated = true;
        }
      }
      if (!updated) updatedCharts.push(chart);
      updatedCharts.sort((a: Chart, b: Chart) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
      setCharts(updatedCharts);
      if (updated) alert(false, "The Chart was updated.");
      else alert(false, "The Chart was created.");
    }
    setShowChartModal(false);
  };

  const onDeleteChart = (chartId: string) => {
    let updatedCharts = [];
    for (let chart of [...charts])
      if (chart._id !== chartId) updatedCharts.push(chart);
    setCharts(updatedCharts);
  };

  const onNewPreset = (preset: ChartPreset) => {
    if (preset && preset._id) {
      let updatedPresets = [...chartPresets];
      let updated = false;
      for (let i in updatedPresets) {
        if (updatedPresets[i]._id === preset._id) {
          updatedPresets[i] = preset;
          updated = true;
        }
      }
      if (!updated) updatedPresets.push(preset);
      updatedPresets.sort((a: ChartPreset, b: ChartPreset) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
      setChartPresets(updatedPresets);
      setChartPreset(preset);
      if (updated) alert(false, "The Preset was updated.");
      else alert(false, "The Preset was saved.");
    }
    setShowPresetModal(false);
  };

  const onDeletePreset = (presetId: string) => {
    let updatedPresets = [];
    for (const preset of chartPresets)
      if (preset._id !== presetId) updatedPresets.push(preset);
    setChartPresets(updatedPresets);
    setChartPreset(undefined);
    alert(false, "The Preset was deleted.");
  };

  const fetchMissingData = () => {
    setFetchingMissingData(true);
    requestMissingData(props.thing._id)
      .then((data: any) => {
        props.stream.pushMissingData(data);
        setFetchingMissingData(false);
        alert(false, "Missing data was merged.");
      })
      .catch((_: any) => {
        setFetchingMissingData(false);
        alert(true, "Could not fetch missing streaming data.");
      });
  };

  const onConnection = () => setStreaming(true);
  const onStop = () => setStreaming(false);

  return (
    <>
      {fetchingPresets ? (
        <DashboardLoading>
          <CircularProgress style={{ color: "black" }} />
          <br />
          <br />
          <b>Fetching Presets...</b>
        </DashboardLoading>
      ) : (
        <>
          <DashNav margin={context.margin}>
            <div className="left">
              {props.stream.worthGettingHistoricalData() &&
                charts.length > 0 &&
                streaming && (
                  <>
                    {size.width >= 916 ? (
                      <ToolTip value="Fetch Missing Data">
                        <IconButton
                          img={<CachedOutlined />}
                          onClick={() => fetchMissingData()}
                          loading={fetchingMissingData}
                        />
                      </ToolTip>
                    ) : (
                      <TextButton
                        title="Fetch Missing Data"
                        onClick={() => fetchMissingData()}
                        loading={fetchingMissingData}
                      />
                    )}
                  </>
                )}
              {size.width >= 916 && charts.length <= 10 ? (
                <ToolTip value="New Chart">
                  <IconButton
                    img={<Add />}
                    onClick={() => setShowChartModal(true)}
                  />
                </ToolTip>
              ) : (
                <TextButton
                  title="New Chart"
                  onClick={() => setShowChartModal(true)}
                />
              )}
              {charts.length > 0 && (
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
              {chartPresets.length !== 0 && (
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
                      chartPresets.map((preset) => {
                        return { value: preset, label: preset.name };
                      })
                    );
                    return options;
                  })()}
                  onChange={(value: any) => {
                    setChartPreset(
                      value.label === "New Preset" ? undefined : value.value
                    );
                  }}
                  value={
                    chartPreset
                      ? {
                          value: chartPresets.filter(
                            (p) => p._id === chartPreset._id
                          )[0],
                          label: chartPreset.name,
                        }
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
          <div id="chart-view">{chartUI}</div>
          {charts.length === 0 && (
            <div id="dashboard-loading">
              <div id="dashboard-loading-content">
                <>
                  <b>
                    No Charts yet.
                    {chartPresets.length > 0
                      ? " Create one or select a preset."
                      : ""}
                  </b>
                  <TextButton
                    title="Add Chart"
                    onClick={() => setShowChartModal(true)}
                  />
                </>
              </div>
            </div>
          )}
        </>
      )}
      {showChartModal && (
        <ChartModal
          show={showChartModal}
          toggle={onChartUpdate}
          sensors={props.sensors}
          charts={charts}
        />
      )}
      {showPresetModal && (
        <ChartPresetModal
          show={showPresetModal}
          toggle={onNewPreset}
          chartPreset={chartPreset}
          charts={charts}
          thing={props.thing}
          onDelete={onDeletePreset}
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

export default ChartView;
