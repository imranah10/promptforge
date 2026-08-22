const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src/pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  let content = fs.readFileSync(path.join(dir, file), 'utf8');
  let changed = false;

  if (!content.includes('import ReactMarkdown')) {
    content = "import ReactMarkdown from 'react-markdown';\nimport remarkGfm from 'remark-gfm';\n" + content;
    changed = true;
  }

  const replacements = [
    { regex: />\{result\}</g, rep: '><ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown><' },
    { regex: />\{msg\.text\}</g, rep: '><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown><' },
    { regex: />\{m\.content\}</g, rep: '><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown><' },
    { regex: />\{resultA\}</g, rep: '><ReactMarkdown remarkPlugins={[remarkGfm]}>{resultA}</ReactMarkdown><' },
    { regex: />\{resultB\}</g, rep: '><ReactMarkdown remarkPlugins={[remarkGfm]}>{resultB}</ReactMarkdown><' }
  ];

  replacements.forEach(({regex, rep}) => {
    if (regex.test(content)) {
      content = content.replace(regex, rep);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(path.join(dir, file), content);
    console.log('Updated ' + file);
  }
});
