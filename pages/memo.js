import React, { useState } from 'react';
import {
  Page,
  Navbar,
  NavbarBackLink,
  Block,
  BlockTitle,
  BlockHeader,
  Dialog,
  DialogButton,
  List,
  ListInput,
  ListButton,
  Preloader,
  Button
} from 'konsta/react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

export default function Memo() {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [memo, setMemo] = useState(null);
  const [alertOpened, setAlertOpened] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transcribe?videoUrl=${encodeURIComponent(videoUrl)}`);
      const data = await res.json();
      setMemo(data.memo);
    } catch (error) {
      setAlertOpened(true);
    }
    setLoading(false);
  };

  return (
    <Page>
      <Navbar
        title="Memo"
        className="top-0 sticky"
        left={
          <NavbarBackLink text="Back" onClick={() => history.back()} />
        }
      />

      <BlockTitle>AI-Powered Meeting Memo</BlockTitle>
        <BlockHeader>
        Tired of manually summarizing your lengthy meetings? Simply provide the URL of your recorded video meeting, and AI will generate a comprehensive summary for you. Not just that, the AI extracts key points, conclusions, decisions, and even offers suggestions for improving your future meetings. Once the memo is generated, you can easily copy it to your clipboard with a single click.
        </BlockHeader>
        <List strong inset>
          <ListInput required
            label="Video URL" 
            type="url" 
            placeholder="URL" 
            value={videoUrl} 
            onInput={(e) => setVideoUrl(e.target.value)}
          />
          <ListButton onClick={handleGenerate}>
            {loading ? <Preloader /> : 'Generate'}
          </ListButton>
        </List>

        {memo && (
          <Block strong className="space-y-4">
            <p>{memo}</p>
            <CopyToClipboard text={memo}>
              <Button large>Copy to Clipboard</Button>
            </CopyToClipboard>
          </Block>
        )}
      <Dialog
        opened={alertOpened}
        onBackdropClick={() => setAlertOpened(false)}
        title="Memo"
        content="Oops, an error occurred. Try again."
        buttons={
          <DialogButton onClick={() => setAlertOpened(false)}>Ok</DialogButton>
        }
      />
    </Page>
  );
}