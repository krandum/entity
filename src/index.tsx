import * as React from "react";
import { render } from 'react-dom';

import Main from './components/Main';
import AppState from "./appState";
import { Provider } from "mobx-react";

class App extends React.Component<null, any> {
    appState: AppState;

    constructor(props: any) {
        super(props);
        this.appState = new AppState();
    }

    render() {
        return (
            <Provider
                appState={this.appState}
            >
                <Main />
            </Provider>
        );
    }
}

render(<App />, document.getElementById('root'));
