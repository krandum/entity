import { observable } from 'mobx';

export default class AppState {
    @observable page: string = 'perks';
}
