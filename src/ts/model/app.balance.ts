/// <reference path="../define.ts"/>
/// <reference path="app.data.ts"/>
/// <reference path="../library/utility.ts"/>

/* MODEL */

module MODULE.MODEL.APP {

  export class Balance implements BalanceInterface {

    constructor(private model_: ModelInterface, private app_: AppLayerInterface) { }
    
    private util_ = LIBRARY.Utility

    private host_: string = ''
    host = () => this.host_

    private isBalanceable_(setting: SettingInterface): boolean {
      return setting.balance.active && !!Number(this.app_.data.getCookie(setting.balance.client.cookie.balance));
    }

    enable(setting: SettingInterface): void {
      if (!setting.balance.active) {
        return void this.disable(setting);
      }
      if (!setting.balance.client.support.browser.test(window.navigator.userAgent)) {
        return void this.disable(setting);
      }

      if (!this.app_.data.setCookie(setting.balance.client.cookie.balance, '1')) {
        return void this.disable(setting);
      }
      if (setting.balance.client.support.redirect.test(window.navigator.userAgent)) {
        this.app_.data.setCookie(setting.balance.client.cookie.redirect, '1');
      }
    }

    disable(setting: SettingInterface): void {
      if (this.app_.data.getCookie(setting.balance.client.cookie.balance)) {
        this.app_.data.setCookie(setting.balance.client.cookie.balance, '0');
      }
      if (this.app_.data.getCookie(setting.balance.client.cookie.redirect)) {
        this.app_.data.setCookie(setting.balance.client.cookie.redirect, '0');
      }
      this.changeServer('', setting);
    }

    changeServer(host: string, setting: SettingInterface = this.model_.configure(window.location)): string {
      if (!setting || !this.isBalanceable_(setting)) {
        this.host_ = '';
      } else {
        this.host_ = host || '';
        this.app_.data.setCookie(setting.balance.client.cookie.host, host);
      }
      return this.host();
    }

    private chooseServers_(expires: number, limit: number, weight: number, respite: number, hosts: string[]): string[]{
      hosts = hosts.slice();
      var servers = this.app_.data.getServerBuffers(),
          serverTableByScore: { [score: string]: ServerStoreSchema } = {},
          result: string[];

      (() => {
        var now: number = new Date().getTime();
        for (var i in servers) {
          if (now > servers[i].date + expires) {
            continue;
          }
          serverTableByScore[servers[i].score] = servers[i];
        }
      })();

      result = [];
      var scores = Object.keys(serverTableByScore).sort(compareNumbers);
      function compareNumbers(a, b) {
        return +a - +b;
      }
      for (var i = 0, score: string; score = result.length < limit && scores[i]; i++) {
        var server = serverTableByScore[score],
            host = server.host,
            state = server.state;
        if (state && state + respite >= new Date().getTime()) {
          ~jQuery.inArray(host, hosts) && hosts.splice(jQuery.inArray(host, hosts), 1);
          continue;
        } else if (state) {
          this.app_.data.saveServer(server.host, server.score, 0);
        }
        if (!+score) {
          continue;
        }
        if (!host && weight && !(Math.floor(Math.random() * weight))) {
          ~jQuery.inArray(host, hosts) && hosts.splice(jQuery.inArray(host, hosts), 1)
          continue;
        }
        result.push(host);
      }
      if (hosts.length >= 2 && result.length < 2 || !result.length) {
        result = hosts.slice(Math.floor(Math.random() * hosts.length));
      }
      return result;
    }

    chooseServer(setting: SettingInterface): string {
      if (!this.isBalanceable_(setting)) {
        return '';
      }

      // キャッシュの有効期限内の再リクエストは同じサーバーを選択してキャッシュを使用
      var history: HistoryStoreSchema = this.app_.data.getHistoryBuffer(setting.destLocation.href);
      if (history && history.expires && history.expires >= new Date().getTime()) {
        return history.host || '';
      }

      // 最適なサーバーを選択
      var servers: string[] = this.chooseServers_(setting.balance.history.expires, setting.balance.history.limit, setting.balance.weight, setting.balance.server.respite, setting.balance.client.hosts);
      if (servers.length) {
        return servers.shift();
      }

      return '';
    }

    private parallel_ = 6
    bypass(): JQueryDeferred<any> {
      var setting: SettingInterface = this.app_.configure(window.location),
          deferred = jQuery.Deferred();
      if (!this.isBalanceable_(setting)) { return deferred.reject(); }
      var parallel = this.parallel_,
          servers = this.chooseServers_(setting.balance.history.expires, setting.balance.history.limit, setting.balance.weight, setting.balance.server.respite, setting.balance.client.hosts),
          option: JQueryAjaxSettings = jQuery.extend({}, setting.ajax, setting.balance.option.ajax, setting.balance.option.callbacks.ajax);

      var test = (server: string) => {
        var that = this;
        jQuery.ajax(jQuery.extend({}, option, <JQueryAjaxSettings>{
          url: that.util_.normalizeUrl(window.location.protocol + '//' + server + window.location.pathname.replace(/^\/?/, '/') + window.location.search),
          xhr: !setting.balance.option.callbacks.ajax.xhr ? undefined : function () {
            var jqXHR: JQueryXHR;
            jqXHR = that.util_.fire(setting.balance.option.callbacks.ajax.xhr, this, [event, setting]);
            jqXHR = 'object' === typeof jqXHR ? jqXHR : jQuery.ajaxSettings.xhr();
            return jqXHR;
          },
          beforeSend: !setting.balance.option.callbacks.ajax.beforeSend && !setting.server.header ? undefined : function (jqXHR: JQueryXHR, ajaxSetting: JQueryAjaxSettings) {
            if (setting.server.header) {
              jqXHR.setRequestHeader(setting.nss.requestHeader, 'true');
            }
            if ('object' === typeof setting.server.header) {
              jqXHR.setRequestHeader(setting.nss.requestHeader, 'true');
              setting.server.header.area && jqXHR.setRequestHeader(setting.nss.requestHeader + '-Area', this.app_.chooseArea(setting.area, document, document));
              setting.server.header.head && jqXHR.setRequestHeader(setting.nss.requestHeader + '-Head', setting.load.head);
              setting.server.header.css && jqXHR.setRequestHeader(setting.nss.requestHeader + '-CSS', setting.load.css.toString());
              setting.server.header.script && jqXHR.setRequestHeader(setting.nss.requestHeader + '-Script', setting.load.script.toString());
            }

            that.util_.fire(setting.balance.option.callbacks.ajax.beforeSend, this, [event, setting, jqXHR, ajaxSetting]);
          },
          dataFilter: !setting.balance.option.callbacks.ajax.dataFilter ? undefined : function (data: string, type: Object) {
            return that.util_.fire(setting.balance.option.callbacks.ajax.dataFilter, this, [event, setting, data, type]) || data;
          },
          success: function () {
            server = server;
            that.util_.fire(setting.balance.option.ajax.success, this, arguments);
          },
          error: function () {
            server = null;
            that.util_.fire(setting.balance.option.ajax.error, this, arguments);
          },
          complete: function () {
            that.util_.fire(setting.balance.option.ajax.complete, this, arguments);

            if (server) {
              that.host_ = server;
              servers.splice(0, servers.length);
              deferred.resolve();
            } else if (!that.host() && servers.length) {
              test(servers.shift());
            } else {
              deferred.reject();
            }
          }
        }));
      };

      while (parallel--) {
        var server = servers.shift();
        if (!server || server === window.location.host) {
          servers.length && ++parallel;
          continue;
        }

        test(server);
      }
      return deferred;
    }

  }

}
