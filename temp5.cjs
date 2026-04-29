const fs = require('fs');
let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

let lines = c.split('\n');
// We want to delete line 1230. 0-indexed it is 1229.
// But the line number might have shifted. Let's find:
//                     )}
//                     </div>
//                 </div>
//             </div>
//         </motion.div>
//       )}

const targetStr = `                    )}
                    </div>
                </div>
            </div>
        </motion.div>
      )}`;

const replacementStr = `                    )}
                    </div>
                </div>
        </motion.div>
      )}`;

c = c.replace(targetStr, replacementStr);
fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
console.log('Fixed line 1230');
