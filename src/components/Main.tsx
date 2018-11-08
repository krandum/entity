import * as React from 'react';
import { inject, observer } from 'mobx-react';

import './styles.scss';

import Home from './Home';
import Perks from './Perks';
import AppState from "../appState";

interface IProps {
    appState?: AppState;
}

interface IState {
    displayingMenu: boolean;
}

@observer
@inject('appState')
export default class Main extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            displayingMenu: false,
        };
    }

    render() {
        return (
            <main>
                {this.props.appState.page === 'home' &&
                    <Home />
                }
                {this.props.appState.page === 'perks' &&
                    <Perks />
                }
            </main>
        );
    }
}
