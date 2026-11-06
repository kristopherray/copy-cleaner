import {
  Action,
  ActionPanel,
  Clipboard,
  List,
  showHUD,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { transformations } from "./transformations";

type ClipboardState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; text: string };

async function copyResult(text: string, title: string) {
  try {
    await Clipboard.copy(text);
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: "Couldn't copy the result",
    });
    return;
  }
  await showHUD(`Copied as ${title}`);
}

export default function Command() {
  const [clipboard, setClipboard] = useState<ClipboardState>({
    status: "loading",
  });

  useEffect(() => {
    let active = true;
    Clipboard.readText().then(
      (text) => {
        if (active) setClipboard({ status: "ready", text: text ?? "" });
      },
      () => {
        if (active) setClipboard({ status: "error" });
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const text = clipboard.status === "ready" ? clipboard.text : "";
  const results = useMemo(
    () =>
      text
        ? transformations.map(({ title, transform }) => ({
            title,
            result: transform(text),
          }))
        : [],
    [text],
  );

  return (
    <List
      isLoading={clipboard.status === "loading"}
      searchBarPlaceholder="Select a transformation"
    >
      {clipboard.status === "error" && (
        <List.EmptyView
          title="Couldn't read the clipboard"
          description="Copy some text and reopen Copy Clean."
        />
      )}
      {clipboard.status === "ready" && !text && (
        <List.EmptyView
          title="No text on the clipboard"
          description="Copy some text and reopen Copy Clean."
        />
      )}
      {results.map(({ title, result }) => (
        <List.Item
          key={title}
          title={title}
          keywords={
            title === "File-Safe Name"
              ? ["URL Safe String", "filename", "slug"]
              : undefined
          }
          subtitle={
            result
              ? result.slice(0, 140).replace(/\s+/g, " ")
              : "No text left to copy"
          }
          actions={
            result ? (
              <ActionPanel>
                <Action
                  title="Copy to Clipboard"
                  onAction={() => copyResult(result, title)}
                />
              </ActionPanel>
            ) : undefined
          }
        />
      ))}
    </List>
  );
}
