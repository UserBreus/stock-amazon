const fs = require('fs');
let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

// The syntax error is around line 1550:
//                     )}
//                 </div>
//             </div>
//             ) : (
// We need to add an extra </div> after )}

c = c.replace('                    )}\r\n                </div>\r\n            </div>', '                    )}\r\n                    </div>\r\n                </div>\r\n            </div>');
c = c.replace('                    )}\n                </div>\n            </div>', '                    )}\n                    </div>\n                </div>\n            </div>');

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
console.log('Fixed');
