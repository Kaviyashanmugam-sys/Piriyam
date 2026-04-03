import React from 'react';
import { IonApp, setupIonicReact } from '@ionic/react';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import MahalApp from './pages/MahalBookingApp';

setupIonicReact();

const App = () => (
  <IonApp>
    <MahalApp />
  </IonApp>
);

export default App;