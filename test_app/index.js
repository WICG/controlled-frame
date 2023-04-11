import { $, Log, ttPolicy } from './common.js';
import { ControlledFrameController } from './controlledframe_api.js';

/**
 * Service worker
 */
if ('serviceWorker' in navigator) {
  const sanitized = ttPolicy.createScriptURL('/sw.js');
  navigator.serviceWorker.register(sanitized).then(registration => {
    Log.info('Registered Service Worker');
    $('#update_sw_btn').onclick = () => {
      registration.update();
    };
    return navigator.serviceWorker.ready;
  });
}

/**
 * Page initialization
 */
document.addEventListener('DOMContentLoaded', init);
Log.info('DOMContentLoaded event listener registered');

let controller = null;
function init() {
  controller = new ControlledFrameController();
  $('#reset_controlledframe_btn').addEventListener(
    'click',
    controller.CreateControlledFrameTag.bind(controller)
  );
}
