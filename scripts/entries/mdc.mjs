
import {MDCRipple} from '@material/ripple'
import {MDCTabBar} from '@material/tabs'
import {MDCTextField} from '@material/textfield'

let ripple = {MDCRipple}
let tabs = {MDCTabBar}
let textfield = {MDCTextField}

globalThis.mdc = {
  ripple,
  tabs,
  textfield,
}
