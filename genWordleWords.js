"use strict";

const cfg = require("./config.json");
const fs = require("fs");
const readline = require("readline");
const axios = require("axios");
const cheerio = require("cheerio");

let wordCounts = {};

const dictFileStream = fs.createReadStream("/usr/share/dict/words");
const dictFile = readline.createInterface({
    input: dictFileStream,
    output: process.stdout,
    terminal: false
});

dictFile.on("line", (word) => {
    if (word.length !== cfg.wordLen) return;
    word = word.toUpperCase();
    for (let c in word) {
        if (65 > word.charCodeAt(c) || word.charCodeAt(c) > 90) {
            return;
        };
    };
    wordCounts[word] = 0;
});

dictFileStream.on("end", () => {
    let dictWords = Object.keys(wordCounts);
    let timeout = 0;
    for (let i = 0; i < cfg.wikiPages; i++) {
        axios.get("https://en.wikipedia.org/wiki/Special:Random")
            .then((res) => {
                const pageText = cheerio.load(res.data).text();
                const pageWords = pageText.replaceAll('\t', ' ').replaceAll('\n', ' ').replace(/ +(?= )/g, '').trim().split(' ');
                for (let j = 0; j < pageWords.length; j++) {
                    let word = pageWords[j].toUpperCase();
                    if (dictWords.includes(word)) wordCounts[word]++;
                };
                if (i === cfg.wikiPages - 1) {
                    const words = dictWords.sort(function (a, b) { return wordCounts[b] - wordCounts[a] }).slice(0, cfg.wordCount);
                    fs.writeFile("words.txt", words.join('\n'), (err) => {
                        if (err) {
                            console.log("Failed to write words.txt: " + err);
                        } else {
                            console.log("words.txt has been written.");
                        };
                    });
                };
            });
    };
});
