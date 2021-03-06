// Copyright Schulich Racing FSAE
// Written by Jonathan Breidfjord, Justin Tijunelis

import React, { useCallback, useState } from "react";
import ReactHtmlParser from "react-html-parser";
import { CommentView } from "components/cards";
import { Alert, IconButton } from "components/interface";
import { ConfirmModal } from "components/modals";
import { CollectionModal } from "../modals/collectionModal";
import { SessionCard } from "./sessionCard";
import {
  CloseOutlined,
  Edit,
  CommentOutlined,
  CommentsDisabledOutlined,
  DataArray,
} from "@mui/icons-material";
import {
  Thing,
  Session,
  Collection,
  useAppSelector,
  RootState,
  Comment,
  CommentType,
  isAuthAtLeast,
  Operator,
  UserRole,
} from "state";
import { getComments, deleteCollection } from "crud";
import "./_styling/collectionCard.css";

type CollectionCardProps = {
  thing: Thing;
  collection: Collection;
  collections: Collection[];
  sessions: Session[];
  operators: Operator[];
  onCollectionUpdate: (collection: Collection) => void;
  onCollectionDelete: (collectionId: string) => void;
  onSessionUpdate: (session: Session) => void;
  onSessionDelete: (sessionId: string) => void;
};

export const CollectionCard: React.FC<CollectionCardProps> = (
  props: CollectionCardProps
) => {
  const user = useAppSelector((state: RootState) => state.user);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [showSessions, setShowSessions] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertError, setAlertError] = useState<boolean>(false);
  const [alertDescription, setAlertDescription] = useState<string>("");

  const alert = (error: boolean, description: string) => {
    setAlertDescription(description);
    setAlertError(error);
    setShowAlert(true);
  };

  const generateSessions = useCallback(() => {
    let cards: any[] = [];
    for (const session of props.sessions.filter((s) =>
      props.collection.sessionIds.includes(s._id)
    )) {
      cards.push(
        <SessionCard
          key={session._id}
          thing={props.thing}
          session={session}
          collections={props.collections}
          operators={props.operators}
          onUpdate={props.onSessionUpdate}
          onDelete={props.onSessionDelete}
        />
      );
    }
    if (cards.length > 0) return cards;
    else return <div className="no-sessions">No sessions yet!</div>;
  }, [props.sessions, showSessions]);

  const onDelete = () => {
    setDeleteLoading(true);
    deleteCollection(props.collection._id)
      .then(() => {
        setDeleteLoading(false);
        props.onCollectionDelete(props.collection._id);
      })
      .catch((_: any) => {
        setDeleteLoading(false);
        setShowAlert(true);
        alert(true, "Please try again...");
      });
  };

  const fetchComments = () => {
    setCommentsLoading(true);
    getComments(props.collection._id)
      .then((comments: Comment[]) => {
        setComments(comments);
        setCommentsLoading(false);
        setShowComments(true);
      })
      .catch((_: any) => {
        setCommentsLoading(false);
        alert(true, "Please try again...");
      });
  };

  const recurseCommentUpdate = (comment: Comment, comments: Comment[]): any => {
    let newComments: Comment[] = [...comments];
    let updated = false;
    for (let i = 0; i < newComments.length; i++) {
      if (newComments[i]._id === comment._id) {
        newComments[i] = comment;
        return [true, newComments];
      } else {
        let result = recurseCommentUpdate(comment, newComments[i].comments);
        newComments[i].comments = result[1];
        if (result[0]) return [true, newComments];
        else if (newComments[i]._id === comment.commentId) {
          newComments[i].comments.push(comment);
        }
      }
    }
    return [updated, newComments];
  };

  const onCommentUpdate = (comment: Comment) => {
    if (comment && comment._id) {
      let result = recurseCommentUpdate(comment, comments);
      if (!result[0] && !comment.commentId) result[1].push(comment);
      setComments(result[1]);
      alert(false, result[0] ? "Comment updated!" : "Comment created!");
    }
  };

  const recurseCommentDelete = (commentId: string, comments: Comment[]) => {
    let updatedComments = [];
    for (let c of [...comments])
      if (c._id !== commentId) updatedComments.push(c);
    if (updatedComments.length === comments.length)
      for (let c of updatedComments)
        c.comments = recurseCommentDelete(commentId, c.comments);
    return updatedComments;
  };

  const onCommentDelete = (commentId: string) => {
    if (!commentId) return;
    let updatedComments = recurseCommentDelete(commentId, comments);
    setComments(updatedComments);
    alert(false, "Comment deleted!");
  };

  return (
    <div className="card">
      <div className="collection-card">
        <div className="card-title">
          <b>{props.collection.name}</b>
        </div>
        <div>{ReactHtmlParser(props.collection.description)}</div>
        <IconButton
          id="collection-card-delete"
          img={<CloseOutlined />}
          onClick={() => setShowConfirm(true)}
          disabled={!isAuthAtLeast(user, UserRole.LEAD)}
        />
        <IconButton
          id="collection-card-edit"
          img={<Edit />}
          onClick={() => setShowModal(true)}
          disabled={!isAuthAtLeast(user, UserRole.LEAD)}
        />
        <IconButton
          id="collection-card-data"
          img={<DataArray />}
          striked={showSessions}
          onClick={() => {
            setShowComments(false);
            setShowSessions(!showSessions);
          }}
        />
        <IconButton
          id="collection-card-comment"
          img={
            showComments ? <CommentsDisabledOutlined /> : <CommentOutlined />
          }
          onClick={() => {
            showComments ? setShowComments(false) : fetchComments();
            setShowSessions(false);
          }}
          loading={commentsLoading}
          disabled={!isAuthAtLeast(user, UserRole.MEMBER)}
        />
        <ConfirmModal
          title={
            "Are you sure you want to delete Collection '" +
            props.collection.name +
            "'?"
          }
          show={showConfirm}
          toggle={() => setShowConfirm(false)}
          onConfirm={onDelete}
          loading={deleteLoading}
        />
        {showModal && (
          <CollectionModal
            show={showModal}
            toggle={(collection: Collection) => {
              if (collection) props.onCollectionUpdate(collection);
              setShowModal(false);
            }}
            thing={props.thing}
            collection={props.collection}
            sessions={props.sessions}
          />
        )}
        <Alert
          title={alertError ? "Something went wrong..." : "Success"}
          description={alertDescription}
          color={alertError ? "red" : "green"}
          onDismiss={() => setShowAlert(false)}
          show={showAlert}
          slideOut
        />
      </div>
      {showComments && (
        <CommentView
          contextId={props.collection._id}
          comments={comments}
          type={CommentType.COLLECTION}
          onUpdate={onCommentUpdate}
          onDelete={onCommentDelete}
        />
      )}
      {showSessions && (
        <div className="collection-session-cards">{generateSessions()}</div>
      )}
    </div>
  );
};
