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

export default function Narrator() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [alertOpened, setAlertOpened] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      setVideoUrl(data.url);
    } catch (error) {
      setAlertOpened(true);
    }
    setLoading(false);
  };

  return (
    <Page>
      <Navbar
        title="Narrator"
        className="top-0 sticky"
        left={
          <NavbarBackLink text="Back" onClick={() => history.back()} />
        }
      />
      <BlockTitle>AI-Narrated Videos</BlockTitle>
        <BlockHeader>
          Write a script and the AI narrator will create a voiceover video painting the story with a generated image.
        </BlockHeader>
        <List strong inset>
          <ListInput
            label="Text (500 characters)" 
            type="textarea" 
            placeholder="Your text for narrator.." 
            inputClassName="!h-20 resize-none"
            value={text} 
            onInput={(e) => setText(e.target.value)}
            maxLength="500"
            required={true}
          />
          <ListButton onClick={handleGenerate}>
            {loading ? <Preloader /> : 'Generate'}
          </ListButton>
        </List>

        {videoUrl && (
          <Block strong className="space-y-4">
            <a href={videoUrl} download>
              <Button large>Download</Button>
            </a>
          </Block>
        )}
      <Dialog
        opened={alertOpened}
        onBackdropClick={() => setAlertOpened(false)}
        title="Narrator"
        content="Oops, an error occurred. Try again."
        buttons={
          <DialogButton onClick={() => setAlertOpened(false)}>Ok</DialogButton>
        }
      />
    </Page>
  );
}