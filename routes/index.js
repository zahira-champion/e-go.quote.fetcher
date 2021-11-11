const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

const url = 'https://www.e-go.com.au/quote-book/';

const determinedShippingQuote = (sendingSuburb, receivingSuburb, length, width, height, weight) => {
	return new Promise((resolver, rejector) => {
		puppeteer.launch().then(browser => {
			browser.newPage().then(page => {
				page.goto(url).then(() => {
					page.waitForSelector('input#transvirtualStep', { timeout: 3000 }).then(() => {
						const goBackDecisionHandler = new Promise(resolve => {
							page.$eval('#transvirtual-quotewizard input.transvirtual-backbtn', (el) => el.value).then(() => {
								page.click('#transvirtual-quotewizard input.transvirtual-backbtn').then(() => {
									page.waitForSelector('input#transvirtualStep', { timeout: 3000 }).then(() => {
										resolve(true);
									}, () => {
										rejector('Request timeout');
										browser.close().then(() => console.log('Puppeteer ended unexpectedly, quote form not loaded before timeout, after back button clicked'));
									});
								}, () => {
									rejector('Unexpected error');
									browser.close().then(() => console.log('Puppeteer ended unexpectedly, unable to locate back button on form'));
								});
							}, () => {
								resolve(true);
							});
						});
						goBackDecisionHandler.then(() => {
							page.$eval('#transvirtual-quotewizard input#IdSendingSuburb', (el, value) => el.value = value, sendingSuburb).then(() => {
								page.$eval('#transvirtual-quotewizard input#IdReceivingSuburb', (el, value) => el.value = value, receivingSuburb).then(() => {
									page.$eval('#transvirtual-quotewizard tbody.tvItemtable > tr > td:nth-child(1) > input', (el, value) => el.value = value, '1').then(() => {
										page.$eval('#transvirtual-quotewizard tbody.tvItemtable > tr > td:nth-child(2) > select', (el, value) => el.value = value, 'Carton').then(() => {
											page.$eval('#transvirtual-quotewizard tbody.tvItemtable > tr > td:nth-child(3) > input', (el, value) => el.value = value, length).then(() => {
												page.$eval('#transvirtual-quotewizard tbody.tvItemtable > tr > td:nth-child(4) > input', (el, value) => el.value = value, width).then(() => {
													page.$eval('#transvirtual-quotewizard tbody.tvItemtable > tr > td:nth-child(5) > input', (el, value) => el.value = value, height).then(() => {
														page.$eval('#transvirtual-quotewizard tbody.tvItemtable > tr > td:nth-child(6) > input', (el, value) => el.value = value, weight).then(() => {
															page.click('#transvirtual-quotewizard input.transvirtual-forwardbtn').then(() => {
																page.waitForSelector('input#transvirtualStep', { timeout: 3000 }).then(() => {
																	page.$eval('#transvirtual-quotewizard > .transvirtualRateSelection > tbody > tr > td:nth-child(3)', el => el.innerHTML).then(result => {
																		resolver(result);
																	}, () => {
																		rejector('No result');
																		browser.close().then(() => console.log('Puppeteer ended unexpectedly, quote form did not display a quote'));
																	});
																}, () => {
																	rejector('Request timeout');
																	browser.close().then(() => console.log('Puppeteer ended unexpectedly, quote form not loaded before timeout'));
																});
															}, () => {
																rejector('Unexpected error');
																browser.close().then(() => console.log('Puppeteer ended unexpectedly, unable to locate next button'));
															});
														}, () => {
															rejector('Unexpected error');
															browser.close().then(() => console.log('Puppeteer ended unexpectedly, unable to locate package weight input'));
														});
													}, () => {
														rejector('Unexpected error');
														browser.close().then(() => console.log('Puppeteer ended unexpectedly, unable to locate package height input'));
													});
												}, () => {
													rejector('Unexpected error');
													browser.close().then(() => console.log('Puppeteer ended unexpectedly, unable to locate package width input'));
												});
											}, () => {
												rejector('Unexpected error');
												browser.close().then(() => console.log('Puppeteer ended unexpectedly, unable to locate package length input'));
											});
										}, () => {
											rejector('Unexpected error');
											browser.close().then(() => console.log('Puppeteer ended unexpectedly, unable to locate package type input (select)'));
										});
									}, () => {
										rejector('Unexpected error');
										browser.close().then(() => console.log('Puppeteer ended unexpectedly, unable to locate quantity input'));
									});
								}, () => {
									rejector('Unexpected error');
									browser.close().then(() => console.log('Puppeteer ended unexpectedly, unable to locate ReceivingSuburb input'));
								});
							}, () => {
								rejector('Unexpected error');
								browser.close().then(() => console.log('Puppeteer ended unexpectedly, unable to locate SendingSuburb input'));
							});
						});
					}, () => {
						rejector('Request timeout');
						browser.close().then(() => console.log('Puppeteer ended unexpectedly, quote form not loaded before timeout'));
					});
				}, () => {
					rejector('Unexpected error');
					browser.close().then(() => console.log('Puppeteer ended unexpectedly, unable to reach ' + url));
				});
			}, () => {
				rejector('Unexpected error');
				browser.close().then(() => console.log('Puppeteer ended unexpectedly, unable to create new page'));
			});
		}, () => {
			rejector('Unexpected error');
		});
	});
};

router.get('/:sendingSuburb/:receivingSuburb/:length/:width/:height/:weight', (req, res) => {
	const sendingSuburb = req.params.sendingSuburb;
	const receivingSuburb = req.params.receivingSuburb;
	const length = req.params.length;
	const width = req.params.width;
	const height = req.params.height;
	const weight = req.params.weight;
	determinedShippingQuote(sendingSuburb, receivingSuburb, length, width, height, weight).then(value => {
		res.json({ quote: value });
	}, error => {
		res.status(500).send(error);
	});
});

module.exports = router;
