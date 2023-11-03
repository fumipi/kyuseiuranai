import { OPENAI_API_KEY } from "../config.js"

// 九星とその性格の辞書（性格は今回表示していない。代わりにAPIで明日の運勢を呼び出すことにしたから。）
const kyusei = {
  1: ["一白水星", "柔軟性や忍耐力があり、どんな相手にも合わせることができる星です。一方、重要なタイミングでは、相手の意見に流されず自分の意志を貫ける強さも兼ね備えています。誰からも好かれるため様々な相談を受けやすいですが、本当の思いは胸に秘めているタイプでもあるでしょう。"],
  2: ["二黒土星", "温厚な性格で思いやりにあふれ、面倒見もいい星です。陰日向なく努力ができ、マイペースさを持ち合わせているのも大きな特徴。基本的には穏やかでのんびりしたタイプですが、一度やる気になると誰にも止められないほどのパワーを発揮します。"],
  3: ["三碧木星", "好奇心が旺盛で、周囲の人に元気を与えることができる星です。また、悩んだり落ち込んだりしても、それを見せずに自分の足で立ちあがることができます。興味があることについては徹底的に深堀りする力を持っていて、その知識を活かす行動力もあるので、時代の流れをつかむことができます。"],
  4: ["四緑木星", "社交的でコミュニケーション能力がとても高い星です。人あたりがいいだけでなく、その距離感も程よく、幅広い層から好かれるでしょう。また、穏やかであればあるほどいい運気でいられます。なにかに縛られることを嫌う「自由人」な一面もあります。"],
  5: ["五黄土星", "度胸満点で、有言実行できる力を持った星です。想いを現実にする力があり、自分で「できる！」と思ったことは本当にできてしまいます。優しさも兼ね備えているので、相手にとってなにがベストなのかを考えて行動することも得意でしょう。"],
  6: ["六白金星", "正義感があり、しっかりとした自分の芯を持っている星です。目的達成のためには試行錯誤することもいとわず、自分で決めたことは最後までやり遂げる力があるでしょう。完璧主義で自他ともに厳しい一面もありますが、誰に対しても同じ態度でいることができ、分け隔てなく接することができます。"],
  7: ["七赤金星", "愛嬌があり、要領のよさも兼ね備えた星です。人を惹きつける天性の力を持つ人気者であるため、いいにくいことをはっきりいっても嫌われないという不思議な魅力もあるでしょう。いつまでも楽しむことを忘れない子どものような心を持っていますが、自立心も強く、現実主義な一面もあります。"],
  8: ["八白土星", "責任感があって、義理人情に厚い星です。周囲からの信頼を得ることができて、頼られる存在になれるでしょう。また、どんな苦労があってもそれを乗り越え、次のステージに進むことができます。周囲があっと驚くような、思い切った行動をとることもあります。"],
  9: ["九紫火星", "論理的で情熱や知性もあり、ものごとを前に進めるパワーがある星です。どこにいても目立つ華やかさも持ちあわせています。集中力や突破力もあり、たくさんの成果をあげることができるでしょう。また、美的センスも備わっています。"],
}

// 誕生年から九星を取得する関数
function getKyusei(year) {
  let amari = parseInt(year, 10) % 9;
  if (amari < 2) {
    var num = 2 - amari;
  } else {
    var num = 11 - amari;
  }
  return [num, kyusei[num]];
}

// 明日の日付を取得する関数
function getTomorrow() {
  let date = new Date();
  date.setDate(date.getDate() + 1);
  let y = date.getFullYear();
  let m = ('00' + (date.getMonth() + 1)).slice(-2);
  let d = ("00" + date.getDate()).slice(-2);
  const result = y + '年' + m + '月' + d + '日';
  return result
}

// OpenAI APIを呼び出す関数
async function callOpenAI(messages) {

  const endpoint = 'https://api.openai.com/v1/chat/completions';
  const apiKey = OPENAI_API_KEY;

  let response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo-16k-0613",
      messages,
      max_tokens: 200,
      temperature: 1,
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  };

  let data = await response.json();
  console.log(data["choices"][0]["message"]["content"]);
  return data["choices"][0]["message"]["content"];
}

// タイプライターのようにテキストを打ち出す関数
function typeText(element) {
  let text = element.textContent;
  element.textContent = '';
  element.style.display = 'block';
  let charIndex = 0;

  function typeChar() {
    if (charIndex < text.length) {
      element.textContent += text[charIndex];
      charIndex++;
      setTimeout(typeChar, 100);
    }
  }
  typeChar();
}

// フォームで「占う」ボタンを押すと、全部をまとめて実行する流れ
const birth_year_form = document.forms[0];
birth_year_form.addEventListener("submit", async function (event) {
  event.preventDefault();

  // 何度でも連続で占えるように前回の結果をリセット
  // 特に星のアニメーションは一度nodeを取り外してもう一度追加することで、最初からスタートできる。
  let crystalBall = document.getElementById("crystal-ball");
  let clonedBall = crystalBall.cloneNode(true);
  document.getElementById("ball-parent").removeChild(crystalBall);
  clonedBall.className = '';
  document.getElementById("ball-parent").appendChild(clonedBall);
  // 占いの結果もリセット
  document.getElementById('result1').style.display = 'none';
  document.getElementById('result2').style.display = 'none';

  // 生まれ年をフォームから取得
  let year = document.getElementById("birth-year").value;
  let num = getKyusei(year)[0];
  let result = getKyusei(year)[1];
  console.log(result);
  const messages = [
    { 'role': 'system', 'content': "あなたは九星気学を学んだ高名な占い師です。高齢の日本人男性で、語尾に「じゃ。」や「おる。」「じゃな。」「ぞよ」などを使います。依頼者の九星気学の星と、明日が何月何日かは依頼者が伝えますので、それに基づいて明日の運勢を占い、200字以内で簡潔に答えてください。文の冒頭は明日何年何月何日（依頼者の言った日付をYYYY年MM月DD日の形式で入れてください。時刻は不要です。）のお主の運勢はじゃな、から始めて下さい。" },
    { 'role': 'user', content: `私の九星は${result[0]}です。明日${getTomorrow()}の私の運勢を教えてください。` }
  ]
  document.getElementById("crystal-ball").classList.add("crystal-ball-flare",`crystal-ball-flare-${num}`);
  document.getElementById("result1").innerText = `お主の星は${result[0]}じゃな。お主の運勢を占ってしんぜよう。` ;
  setTimeout(() => {
    typeText(document.getElementById('result1'));
  }, 2000);
  let typingDurationForResult1 = document.getElementById('result1').textContent.length * 50;
  let otsuge = await callOpenAI(messages);
  document.getElementById("result2").innerText = otsuge;
  setTimeout(() => {
    typeText(document.getElementById('result2'));
  }, typingDurationForResult1);
});

