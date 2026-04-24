const fs = require('fs');
let s = fs.readFileSync('src/pages/Ingresos.tsx', 'utf8');

s = s.replace(`      </Modal>
      </div>
      </motion.div>

      {tipoIngreso !== 'importaciones' && (`, `      </Modal>

      {tipoIngreso !== 'importaciones' && (`);

s = s.replace(`      </>
      )}

    </div>`, `      </>
      )}
      </div>
      </motion.div>

    </div>`);

fs.writeFileSync('src/pages/Ingresos.tsx', s);
console.log('Fixed tags structure');
