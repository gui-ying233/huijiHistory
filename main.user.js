// ==UserScript==
// @name         灰机wiki查看版本历史
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  以另一种方式查看灰机wiki版本历史（绕过权限错误）。
// @author       鬼影233
// @match        *.huijiwiki.com/*
// @icon         https://av.huijiwiki.com/site_avatar_www_l.png
// ==/UserScript==

(function () {
	"use strict";
	(async function () {
		await new Promise(resolve => {
			setInterval(() => {
				if (
					typeof mw !== "undefined" &&
					typeof mw.Api !== "undefined"
				) {
					resolve();
					return;
				}
			}, 50);
		});
		if (
			mw.config.get("wgAction") !== "history" ||
			!document.body.getElementsByClassName("permissions-errors")[0]
		)
			return;
		const pageName = mw.config.get("wgPageName");
		try {
			document.getElementsByTagName(
				"h1"
			)[0].innerHTML = `“${pageName}”的版本历史`;
		} catch {}
		document.title = document.title.replace(
			"权限错误",
			`“${pageName}”的版本历史`
		);
		const pagehistory = document.createElement("ul");
		pagehistory.id = "pagehistory";
		document.getElementById("mw-content-text").innerHTML =
			pagehistory.outerHTML;
		const api = new mw.Api();
		const creatRevLi = (revId, user, comment, timestamp, size) => {
			const li = document.createElement("li");
			li.dataset.mwRevid = revId;
			li.innerHTML = `<a href="${mw.util.getUrl("", {
				oldid: revId,
			})}" class="mw-changeslist-date" title="${pageName}">${timestamp}</a>‎ <span class="history-user"><a href="${mw.util.getUrl(
				`User:${user}`
			)}" class="mw-userlink markrights markBlockInfo user-link user-avatar-added" title="User:${user}" data-username="${user}"><bdi>${user}</bdi></a><span class="mw-usertoollinks">（<a href="${mw.util.getUrl(
				`User talk:${user}`
			)}" class="mw-usertoollinks-talk user-link" title="User talk:${user}">讨论</a> | <a href="${mw.util.getUrl(
				`Special:Contributions/${user}`
			)}" class="mw-usertoollinks-contribs user-link" title="Special:用户贡献/${user}">贡献</a>）</span></span>‎ <span class="mw-changeslist-separator">. .</span> <span class="history-size">（${size}字节）</span>‎ <span class="mw-changeslist-separator">. .</span>  <span class="comment">（${comment}）</span>`;
			document.getElementById("pagehistory").appendChild(li);
		};
		api.get({
			action: "compare",
			format: "json",
			fromtitle: pageName,
			torelative: "prev",
			prop: "ids|user|parsedcomment|timestamp|size",
			utf8: 1,
			formatversion: 2,
		}).done(d => {
			d = d.compare;
			creatRevLi(
				d.torevid,
				d.touser,
				d.toparsedcomment,
				d.totimestamp,
				d.tosize
			);
			creatRevLi(
				d.fromrevid,
				d.fromuser,
				d.fromparsedcomment,
				d.fromtimestamp,
				d.fromsize
			);
			(function getRev(fromrev) {
				api.get({
					action: "compare",
					format: "json",
					fromrev,
					torelative: "prev",
					prop: "ids|title|user|parsedcomment|timestamp|size",
					utf8: 1,
					formatversion: 2,
				}).done(d => {
					d = d.compare;
					if (!d.fromrevid) return;
					creatRevLi(
						d.fromrevid,
						d.fromuser,
						d.fromparsedcomment,
						d.fromtimestamp,
						d.fromsize
					);
					getRev(d.fromrevid);
				});
			})(d.fromrevid);
		});
	})();
})();
