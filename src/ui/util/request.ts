
function getParameterByName(name: string) {
  name = name.replace(/[[\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(window.location.href);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

let baseUrl = location.protocol + '//' + document.domain + ':' + location.port;

const remotePort = getParameterByName('remotePort');
if (remotePort) {
  baseUrl = `http://localhost:${remotePort}`;
}

function makeRequest(method: string, url: string, data?: any): Promise<string> {
  return new Promise((res, rej) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, baseUrl + url);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        res(xhr.responseText);
      } else {
        rej({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      rej({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send(data);
  });
}

export {
  makeRequest,
  baseUrl
}