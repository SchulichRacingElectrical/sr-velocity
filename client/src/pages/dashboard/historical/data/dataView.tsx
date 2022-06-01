// Copyright Schulich Racing FSAE
// Written by Jonathan Breidfjord, Justin Tijunelis

import React, { useEffect, useState } from "react";
import { SegmentedControl, DropDown, TextButton } from "components/interface";
import { Thing, Session, Collection, Operator } from "state";
import { DashboardLoading } from "../../loading";
import { CollectionView } from "./collectionView";
import { SessionView } from "./sessionView";
import { getSessions, getCollections, getOperators } from "crud";
import { CircularProgress } from "@mui/material";
import "./_styling/dataView.css";

enum ListType {
  SESSION = "SESSION",
  COLLECTION = "COLLECTION",
}

interface DataViewProps {
  things: Thing[];
  thing: Thing;
  onThingChange: (thing: Thing) => void;
}

const DataView: React.FC<DataViewProps> = (props: DataViewProps) => {
  const [listType, setListType] = useState<ListType>(ListType.SESSION);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [fetching, setFetching] = useState<{
    [k: string]: string | boolean;
  }>({ fetching: false, error: false });

  useEffect(() => fetchCollectionsOperatorsSessions(), []);
  useEffect(() => {
    fetchCollectionsOperatorsSessions();
  }, [props.thing]);

  const fetchCollectionsOperatorsSessions = () => {
    setFetching({
      fetching: true,
      error: false,
    });
    getOperators()
      .then((operators: Operator[]) => {
        let thingOperators = operators.filter((o) =>
          o.thingIds.includes(props.thing._id)
        );
        thingOperators.sort((a: Operator, b: Operator) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
        setOperators(thingOperators);
        getSessions(props.thing._id)
          .then((sessions: Session[]) => {
            setSessions(sessions);
            getCollections(props.thing._id)
              .then((collections: Collection[]) => {
                setCollections(collections);
                setFetching({ ...fetching, fetching: false });
              })
              .catch((_: any) =>
                setFetching({ ...fetching, fetching: false, error: true })
              );
          })
          .catch((_: any) =>
            setFetching({ ...fetching, fetching: false, error: true })
          );
      })
      .catch((_: any) =>
        setFetching({ ...fetching, fetching: false, error: true })
      );
  };

  const onSessionUpdate = (session: Session) => {
    if (session && session._id) {
      let updatedSessions = [...sessions];
      for (let i in sessions)
        if (updatedSessions[i].name === session.name)
          updatedSessions[i] = session;
      setSessions(updatedSessions);
    }
  };

  const onSessionDelete = (sessionId: string) => {
    let updatedSessions = [];
    for (let session of sessions)
      if (session._id !== sessionId) updatedSessions.push(session);
    setSessions(updatedSessions);
  };

  const onCollectionUpdate = (collection: Collection) => {
    if (collection && collection._id) {
      let updatedCollections = [...collections];
      for (let i in collections)
        if (updatedCollections[i].name === collection.name)
          updatedCollections[i] = collection;
      setCollections(updatedCollections);
    }
  };

  const onCollectionDelete = (collectionId: string) => {
    let updatedCollections = [];
    for (let collection of collections)
      if (collection._id !== collectionId) updatedCollections.push(collection);
    setCollections(updatedCollections);
  };

  let viewChange = (
    <SegmentedControl
      name="view"
      options={[
        { label: "Sessions", value: ListType.SESSION, default: true },
        { label: "Collections", value: ListType.COLLECTION },
      ]}
      onChange={setListType}
    />
  );

  let thingChange = (
    <DropDown
      placeholder="Select Thing..."
      options={props.things.map((thing) => {
        return {
          value: thing,
          label: thing.name,
        };
      })}
      defaultValue={
        props.thing ? { value: props.thing, label: props.thing.name } : null
      }
      onChange={(value: any) => props.onThingChange(value.value)}
      isSearchable
    />
  );

  if (fetching["fetching"] || fetching["error"]) {
    return (
      <DashboardLoading>
        {(() => {
          if (fetching["fetching"]) {
            return (
              <>
                <CircularProgress style={{ color: "black" }} />
                <br />
                <br />
                <b>Fetching Collections, Operators, and Sessions...</b>
              </>
            );
          } else {
            return (
              <>
                <b>Failed to fetch Collections, Operators, and Sessions.</b>
                <TextButton
                  title="Try Again"
                  onClick={() => fetchCollectionsOperatorsSessions()}
                />
              </>
            );
          }
        })()}
      </DashboardLoading>
    );
  } else {
    return (
      <>
        {listType === ListType.SESSION ? (
          <SessionView
            viewChange={viewChange}
            thingChange={thingChange}
            thing={props.thing}
            sessions={sessions}
            collections={collections}
            operators={operators}
            onUpdate={onSessionUpdate}
            onDelete={onSessionDelete}
          />
        ) : (
          <CollectionView
            viewChange={viewChange}
            thingChange={thingChange}
            sessions={sessions}
            collections={collections}
            onUpdate={onCollectionUpdate}
            onDelete={onCollectionDelete}
          />
        )}
      </>
    );
  }
};

export default DataView;
