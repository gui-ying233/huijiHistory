// ==UserScript==
// @name         灰机wiki查看版本历史
// @namespace    https://github.com/gui-ying233/huijiHistory
// @version      2.0.1
// @description  以另一种方式查看灰机wiki版本历史（绕过权限错误）。
// @author       鬼影233, Honoka55
// @match        *.huijiwiki.com/*
// @icon         https://av.huijiwiki.com/site_avatar_www_l.png
// @license      MIT
// @supportURL   https://github.com/gui-ying233/huijiHistory/issues
// ==/UserScript==

(function () {
	"use strict";
	(async function () {
		await new Promise(resolve => {
			const intervId = setInterval(() => {
				if (
					typeof mw !== "undefined" &&
					typeof mw.Api !== "undefined"
				) {
					clearInterval(intervId);
					resolve();
				}
			}, 50);
		});
		if (!document.body.getElementsByClassName("permissions-errors")[0])
			return;
		switch (mw.config.get("wgAction")) {
			case "history":
				const pageName = mw.config.get("wgPageName");
				if (document.getElementsByTagName("h1")[0])
					document.getElementsByTagName(
						"h1"
					)[0].innerHTML = `“${pageName}”的版本历史`;
				document.title = document.title.replace(
					"权限错误",
					`“${pageName}”的版本历史`
				);
				document.getElementById(
					"mw-content-text"
				).innerHTML = `<form action="${mw.util
					.getUrl("", { "": "" })
					.replace(
						/\?=$/,
						""
					)}" id="mw-history-compare"><div><input class="historysubmit mw-history-compareselectedversions-button" title="查看该页面两个选定的版本之间的差异。[ctrl-option-v]" accesskey="v" type="submit" value="对比选择的版本"></div><ul id="pagehistory"></ul></form>`;
				const api = new mw.Api();
				const revisions = [];
				const getHistory = async rvcontinue => {
					api.get({
						action: "query",
						format: "json",
						prop: "revisions",
						titles: pageName,
						utf8: 1,
						formatversion: 2,
						rvprop: "ids|user|parsedcomment|timestamp|size",
						rvlimit: "max",
						rvcontinue,
					}).done(async d => {
						revisions.push(...d.query.pages[0].revisions);
						if (d.continue?.rvcontinue)
							await getHistory(d.continue?.rvcontinue);
						else {
							revisions.forEach(
								({
									revid,
									parentid: oldid,
									user,
									parsedcomment: comment,
									timestamp,
									size,
								}) => {
									const li = document.createElement("li");
									li.dataset.mwRevid = revid;
									const date = new Date(timestamp);
									const newestRev =
										mw.config.get("wgCurRevisionId") ===
										revid;
									li.innerHTML = `<span class="mw-history-histlinks">（${
										newestRev
											? "当前"
											: `<a href="${mw.util.getUrl("", {
													diff: mw.config.get(
														"wgCurRevisionId"
													),
													oldid: revid,
											  })}">当前</a>`
									} | ${
										oldid
											? `<a href="${mw.util.getUrl("", {
													diff: revid,
													oldid,
											  })}">之前</a>`
											: "之前"
									}）</span><input type="radio" value="${revid}" name="oldid" id="mw-oldid-${revid}"><input type="radio" value="${revid}" ${
										newestRev ? "checked='checked'" : ""
									} name="diff" id="mw-diff-${revid}"><a href="${mw.util.getUrl(
										"",
										{
											oldid: revid,
										}
									)}" class="mw-changeslist-date" title="${pageName}">
							${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 (${
										[
											"日",
											"一",
											"二",
											"三",
											"四",
											"五",
											"六",
										][date.getDay()]
									}) ${date
										.getHours()
										.toString()
										.padStart(2, 0)}:${date
										.getMinutes()
										.toString()
										.padStart(
											2,
											0
										)}</a>\u200E <span class="history-user"><a href="${mw.util.getUrl(
										`User:${user}`
									)}" class="mw-userlink markrights markBlockInfo user-link user-avatar-added" title="User:${user}" data-username="${user}"><bdi>${user}</bdi></a><span class="mw-usertoollinks">（<a href="${mw.util.getUrl(
										`User talk:${user}`
									)}" class="mw-usertoollinks-talk user-link" title="User talk:${user}">讨论</a> | <a href="${mw.util.getUrl(
										`Special:Contributions/${user}`
									)}" class="mw-usertoollinks-contribs user-link" title="Special:用户贡献/${user}">贡献</a>）</span></span>\u200E <span class="mw-changeslist-separator">. .</span> <span class="history-size">（${size}字节）</span>\u200E <span class="mw-changeslist-separator">. .</span>  <span class="comment">（${comment}）</span>`;
									document
										.getElementById("pagehistory")
										.appendChild(li);
								}
							);
						}
					});
				};
				await getHistory("|");
				break;
			case "view":
				const searchParams = new URLSearchParams(
					window.location.search
				);
				if (searchParams.get("oldid") || searchParams.get("diff")) {
					const pageName = mw.config.get("wgPageName");
					if (document.getElementsByTagName("h1")[0])
						document.getElementsByTagName("h1")[0].innerHTML =
							pageName;
					document.title = document.title.replace(
						"权限错误",
						pageName
					);
					const api = new mw.Api();
					// @todo: prev & next
					if (searchParams.get("diff")) {
						mw.util.addCSS(
							`.diff{border:0;border-spacing:4px;margin:0;width:100%;table-layout:fixed}.diff td{padding:.33em .5em}.diff td.diff-marker{padding:.25em}.diff col.diff-marker{width:2%}.diff .diff-content{width:48%}.diff td div{word-wrap:break-word}.diff-title{vertical-align:top}.diff-multi,.diff-notice,.diff-ntitle,.diff-otitle{text-align:center}.diff-lineno{font-weight:700}td.diff-marker{text-align:right;font-weight:700;font-size:1.25em;line-height:1.2}.diff-addedline,.diff-context,.diff-deletedline{font-size:88%;line-height:1.6;vertical-align:top;white-space:-moz-pre-wrap;white-space:pre-wrap;border-style:solid;border-width:1px 1px 1px 4px;border-radius:.33em}.diff-addedline{border-color:#a3d3ff}.diff-deletedline{border-color:#ffe49c}.diff-context{background:#f8f9fa;border-color:#eaecf0;color:#222}.diffchange{font-weight:700;text-decoration:none}.diff-addedline .diffchange,.diff-deletedline .diffchange{border-radius:.33em;padding:.25em 0}.diff-addedline .diffchange{background:#d8ecff}.diff-deletedline .diffchange{background:#feeec8}.diff,.diff-currentversion-title{direction:ltr;unicode-bidi:embed}.diff-contentalign-right td{direction:rtl;unicode-bidi:embed}.diff-contentalign-left td{direction:ltr;unicode-bidi:embed}.diff-lineno,.diff-multi,.diff-ntitle,.diff-otitle{direction:ltr!important;unicode-bidi:embed}.mw-diff-movedpara-left,.mw-diff-movedpara-left:active,.mw-diff-movedpara-left:visited,.mw-diff-movedpara-right,.mw-diff-movedpara-right:active,.mw-diff-movedpara-right:visited{display:block;color:transparent}.mw-diff-movedpara-left:hover,.mw-diff-movedpara-right:hover{text-decoration:none;color:transparent}.mw-diff-movedpara-left:after,.mw-diff-movedpara-right:after{display:block;color:#222;margin-top:-1.25em}.mw-diff-movedpara-left:after,.rtl .mw-diff-movedpara-right:after{content:"↪"}.mw-diff-movedpara-right:after,.rtl .mw-diff-movedpara-left:after{content:"↩"}@media print{td.diff-addedline .diffchange,td.diff-context,td.diff-deletedline .diffchange{background-color:transparent}td.diff-addedline .diffchange{text-decoration:underline}td.diff-deletedline .diffchange{text-decoration:line-through}}`
						);
						if (searchParams.get("oldid")) {
							await api
								.get({
									action: "compare",
									format: "json",
									fromrev: searchParams.get("oldid"),
									torev: searchParams.get("diff"),
									utf8: 1,
									formatversion: 2,
								})
								.done(d => {
									document.getElementById(
										"mw-content-text"
									).innerHTML = `<table class="diff diff-contentalign-left" data-mw="interface"><colgroup><col class="diff-marker"><col class="diff-content"><col class="diff-marker"><col class="diff-content"></colgroup><tbody>${d.compare.body}</tbody></table>`;
								});
						} else {
							await api
								.get({
									action: "compare",
									format: "json",
									fromrev: searchParams.get("diff"),
									torelative: "prev",
									utf8: 1,
									formatversion: 2,
								})
								.done(d => {
									document.getElementById(
										"mw-content-text"
									).innerHTML = `<table class="diff diff-contentalign-left" data-mw="interface"><colgroup><col class="diff-marker"><col class="diff-content"><col class="diff-marker"><col class="diff-content"></colgroup><tbody>${d.compare.body}</tbody></table>`;
								});
						}
						if (searchParams.get("diffonly") === "1") return;
						await api
							.get({
								action: "query",
								format: "json",
								prop: "revisions",
								revids: searchParams.get("diff"),
								utf8: 1,
								formatversion: 2,
								rvprop: "content|timestamp",
							})
							.done(d => {
								const date = new Date(
									d.query.pages[0].revisions[0].timestamp
								);
								document.getElementById(
									"mw-content-text"
								).innerHTML += `<h2 class="diff-currentversion-title">${date.getFullYear()}年${
									date.getMonth() + 1
								}月${date.getDate()}日 (${
									["日", "一", "二", "三", "四", "五", "六"][
										date.getDay()
									]
								}) ${date
									.getHours()
									.toString()
									.padStart(2, 0)}:${date
									.getMinutes()
									.toString()
									.padStart(2, 0)}的版本</h2>`;
								api.post({
									action: "parse",
									format: "json",
									title: pageName,
									text: d.query.pages[0].revisions[0].content,
									utf8: 1,
									formatversion: 2,
								}).done(d => {
									document.getElementById(
										"mw-content-text"
									).innerHTML += d.parse.text;
								});
							});
					} else {
						await api
							.get({
								action: "query",
								format: "json",
								prop: "revisions",
								revids: searchParams.get("oldid"),
								utf8: 1,
								formatversion: 2,
								rvprop: "content",
							})
							.done(d => {
								api.post({
									action: "parse",
									format: "json",
									title: pageName,
									text: d.query.pages[0].revisions[0].content,
									prop: "text",
									utf8: 1,
									formatversion: 2,
								}).done(d => {
									document.getElementById(
										"mw-content-text"
									).innerHTML = d.parse.text;
								});
							});
					}
				}
				break;
		}
	})();
})();
