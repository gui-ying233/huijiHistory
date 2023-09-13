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
		if (!document.body.getElementsByClassName("permissions-errors")[0])
			return;
		switch (mw.config.get("wgAction")) {
			case "history":
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
					const date = new Date(timestamp);
					li.innerHTML = `<span class="mw-history-histlinks">（当前 | <a href="${mw.util.getUrl(
						"",
						{
							diff: revId,
							oldid: revId,
						}
					)}">之前</a>）</span><a href="${mw.util.getUrl("", {
						oldid: revId,
					})}" class="mw-changeslist-date" title="${pageName}">
				${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 (${
						["日", "一", "二", "三", "四", "五", "六"][
							date.getDay()
						]
					}) ${date.getHours().toString().padStart(2, 0)}:${date
						.getMinutes()
						.toString()
						.padStart(
							2,
							0
						)}</a>‎ <span class="history-user"><a href="${mw.util.getUrl(
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
				break;
			case "view":
				const searchParams = new URLSearchParams(
					window.location.search
				);
				if (
					searchParams &&
					searchParams.get("oldid") &&
					searchParams.get("diff")
				) {
					const pageName = mw.config.get("wgPageName");
					try {
						document.getElementsByTagName("h1")[0].innerHTML =
							pageName;
					} catch {}
					document.title = document.title.replace(
						"权限错误",
						pageName
					);
					const api = new mw.Api();
					await api
						.get({
							action: "compare",
							format: "json",
							fromtitle: "雪山奥窟冥魂石洞",
							torev: "1246964",
							utf8: 1,
							formatversion: 2,
						})
						.done(d => {
							mw.util.addCSS(
								`.diff{border:0;border-spacing:4px;margin:0;width:100%;table-layout:fixed}.diff td{padding:.33em .5em}.diff td.diff-marker{padding:.25em}.diff col.diff-marker{width:2%}.diff .diff-content{width:48%}.diff td div{word-wrap:break-word}.diff-title{vertical-align:top}.diff-multi,.diff-notice,.diff-ntitle,.diff-otitle{text-align:center}.diff-lineno{font-weight:700}td.diff-marker{text-align:right;font-weight:700;font-size:1.25em;line-height:1.2}.diff-addedline,.diff-context,.diff-deletedline{font-size:88%;line-height:1.6;vertical-align:top;white-space:-moz-pre-wrap;white-space:pre-wrap;border-style:solid;border-width:1px 1px 1px 4px;border-radius:.33em}.diff-addedline{border-color:#a3d3ff}.diff-deletedline{border-color:#ffe49c}.diff-context{background:#f8f9fa;border-color:#eaecf0;color:#222}.diffchange{font-weight:700;text-decoration:none}.diff-addedline .diffchange,.diff-deletedline .diffchange{border-radius:.33em;padding:.25em 0}.diff-addedline .diffchange{background:#d8ecff}.diff-deletedline .diffchange{background:#feeec8}.diff,.diff-currentversion-title{direction:ltr;unicode-bidi:embed}.diff-contentalign-right td{direction:rtl;unicode-bidi:embed}.diff-contentalign-left td{direction:ltr;unicode-bidi:embed}.diff-lineno,.diff-multi,.diff-ntitle,.diff-otitle{direction:ltr!important;unicode-bidi:embed}.mw-diff-movedpara-left,.mw-diff-movedpara-left:active,.mw-diff-movedpara-left:visited,.mw-diff-movedpara-right,.mw-diff-movedpara-right:active,.mw-diff-movedpara-right:visited{display:block;color:transparent}.mw-diff-movedpara-left:hover,.mw-diff-movedpara-right:hover{text-decoration:none;color:transparent}.mw-diff-movedpara-left:after,.mw-diff-movedpara-right:after{display:block;color:#222;margin-top:-1.25em}.mw-diff-movedpara-left:after,.rtl .mw-diff-movedpara-right:after{content:"↪"}.mw-diff-movedpara-right:after,.rtl .mw-diff-movedpara-left:after{content:"↩"}@media print{td.diff-addedline .diffchange,td.diff-context,td.diff-deletedline .diffchange{background-color:transparent}td.diff-addedline .diffchange{text-decoration:underline}td.diff-deletedline .diffchange{text-decoration:line-through}}`
							);
							document.getElementById(
								"mw-content-text"
							).innerHTML = `<table class="diff diff-contentalign-left" data-mw="interface"><colgroup><col class="diff-marker"><col class="diff-content"><col class="diff-marker"><col class="diff-content"></colgroup><tbody>${d.compare.body}</tbody></table>`;
						});
				}
				break;
		}
	})();
})();
