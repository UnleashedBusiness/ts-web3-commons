export const UniswapRouterAbi = [{"type":"function","name":"WETH","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"pure"},{"type":"function","name":"addLiquidity","inputs":[{"name":"tokenA","type":"address","internalType":"address"},{"name":"tokenB","type":"address","internalType":"address"},{"name":"amountADesired","type":"uint256","internalType":"uint256"},{"name":"amountBDesired","type":"uint256","internalType":"uint256"},{"name":"amountAMin","type":"uint256","internalType":"uint256"},{"name":"amountBMin","type":"uint256","internalType":"uint256"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amountA","type":"uint256","internalType":"uint256"},{"name":"amountB","type":"uint256","internalType":"uint256"},{"name":"liquidity","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"type":"function","name":"addLiquidityETH","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"amountTokenDesired","type":"uint256","internalType":"uint256"},{"name":"amountTokenMin","type":"uint256","internalType":"uint256"},{"name":"amountETHMin","type":"uint256","internalType":"uint256"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amountToken","type":"uint256","internalType":"uint256"},{"name":"amountETH","type":"uint256","internalType":"uint256"},{"name":"liquidity","type":"uint256","internalType":"uint256"}],"stateMutability":"payable"},{"type":"function","name":"factory","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"pure"},{"type":"function","name":"getAmountIn","inputs":[{"name":"amountOut","type":"uint256","internalType":"uint256"},{"name":"reserveIn","type":"uint256","internalType":"uint256"},{"name":"reserveOut","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amountIn","type":"uint256","internalType":"uint256"}],"stateMutability":"pure"},{"type":"function","name":"getAmountOut","inputs":[{"name":"amountIn","type":"uint256","internalType":"uint256"},{"name":"reserveIn","type":"uint256","internalType":"uint256"},{"name":"reserveOut","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amountOut","type":"uint256","internalType":"uint256"}],"stateMutability":"pure"},{"type":"function","name":"getAmountsIn","inputs":[{"name":"amountOut","type":"uint256","internalType":"uint256"},{"name":"path","type":"address[]","internalType":"address[]"}],"outputs":[{"name":"amounts","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"view"},{"type":"function","name":"getAmountsOut","inputs":[{"name":"amountIn","type":"uint256","internalType":"uint256"},{"name":"path","type":"address[]","internalType":"address[]"}],"outputs":[{"name":"amounts","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"view"},{"type":"function","name":"quote","inputs":[{"name":"amountA","type":"uint256","internalType":"uint256"},{"name":"reserveA","type":"uint256","internalType":"uint256"},{"name":"reserveB","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amountB","type":"uint256","internalType":"uint256"}],"stateMutability":"pure"},{"type":"function","name":"removeLiquidity","inputs":[{"name":"tokenA","type":"address","internalType":"address"},{"name":"tokenB","type":"address","internalType":"address"},{"name":"liquidity","type":"uint256","internalType":"uint256"},{"name":"amountAMin","type":"uint256","internalType":"uint256"},{"name":"amountBMin","type":"uint256","internalType":"uint256"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amountA","type":"uint256","internalType":"uint256"},{"name":"amountB","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"type":"function","name":"removeLiquidityETH","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"liquidity","type":"uint256","internalType":"uint256"},{"name":"amountTokenMin","type":"uint256","internalType":"uint256"},{"name":"amountETHMin","type":"uint256","internalType":"uint256"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amountToken","type":"uint256","internalType":"uint256"},{"name":"amountETH","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"type":"function","name":"removeLiquidityETHSupportingFeeOnTransferTokens","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"liquidity","type":"uint256","internalType":"uint256"},{"name":"amountTokenMin","type":"uint256","internalType":"uint256"},{"name":"amountETHMin","type":"uint256","internalType":"uint256"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amountETH","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"type":"function","name":"removeLiquidityETHWithPermit","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"liquidity","type":"uint256","internalType":"uint256"},{"name":"amountTokenMin","type":"uint256","internalType":"uint256"},{"name":"amountETHMin","type":"uint256","internalType":"uint256"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"},{"name":"approveMax","type":"bool","internalType":"bool"},{"name":"v","type":"uint8","internalType":"uint8"},{"name":"r","type":"bytes32","internalType":"bytes32"},{"name":"s","type":"bytes32","internalType":"bytes32"}],"outputs":[{"name":"amountToken","type":"uint256","internalType":"uint256"},{"name":"amountETH","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"type":"function","name":"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"liquidity","type":"uint256","internalType":"uint256"},{"name":"amountTokenMin","type":"uint256","internalType":"uint256"},{"name":"amountETHMin","type":"uint256","internalType":"uint256"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"},{"name":"approveMax","type":"bool","internalType":"bool"},{"name":"v","type":"uint8","internalType":"uint8"},{"name":"r","type":"bytes32","internalType":"bytes32"},{"name":"s","type":"bytes32","internalType":"bytes32"}],"outputs":[{"name":"amountETH","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"type":"function","name":"removeLiquidityWithPermit","inputs":[{"name":"tokenA","type":"address","internalType":"address"},{"name":"tokenB","type":"address","internalType":"address"},{"name":"liquidity","type":"uint256","internalType":"uint256"},{"name":"amountAMin","type":"uint256","internalType":"uint256"},{"name":"amountBMin","type":"uint256","internalType":"uint256"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"},{"name":"approveMax","type":"bool","internalType":"bool"},{"name":"v","type":"uint8","internalType":"uint8"},{"name":"r","type":"bytes32","internalType":"bytes32"},{"name":"s","type":"bytes32","internalType":"bytes32"}],"outputs":[{"name":"amountA","type":"uint256","internalType":"uint256"},{"name":"amountB","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"type":"function","name":"swapETHForExactTokens","inputs":[{"name":"amountOut","type":"uint256","internalType":"uint256"},{"name":"path","type":"address[]","internalType":"address[]"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amounts","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"payable"},{"type":"function","name":"swapExactETHForTokens","inputs":[{"name":"amountOutMin","type":"uint256","internalType":"uint256"},{"name":"path","type":"address[]","internalType":"address[]"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amounts","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"payable"},{"type":"function","name":"swapExactETHForTokensSupportingFeeOnTransferTokens","inputs":[{"name":"amountOutMin","type":"uint256","internalType":"uint256"},{"name":"path","type":"address[]","internalType":"address[]"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"swapExactTokensForETH","inputs":[{"name":"amountIn","type":"uint256","internalType":"uint256"},{"name":"amountOutMin","type":"uint256","internalType":"uint256"},{"name":"path","type":"address[]","internalType":"address[]"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amounts","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"nonpayable"},{"type":"function","name":"swapExactTokensForETHSupportingFeeOnTransferTokens","inputs":[{"name":"amountIn","type":"uint256","internalType":"uint256"},{"name":"amountOutMin","type":"uint256","internalType":"uint256"},{"name":"path","type":"address[]","internalType":"address[]"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"swapExactTokensForTokens","inputs":[{"name":"amountIn","type":"uint256","internalType":"uint256"},{"name":"amountOutMin","type":"uint256","internalType":"uint256"},{"name":"path","type":"address[]","internalType":"address[]"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amounts","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"nonpayable"},{"type":"function","name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","inputs":[{"name":"amountIn","type":"uint256","internalType":"uint256"},{"name":"amountOutMin","type":"uint256","internalType":"uint256"},{"name":"path","type":"address[]","internalType":"address[]"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"swapTokensForExactETH","inputs":[{"name":"amountOut","type":"uint256","internalType":"uint256"},{"name":"amountInMax","type":"uint256","internalType":"uint256"},{"name":"path","type":"address[]","internalType":"address[]"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amounts","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"nonpayable"},{"type":"function","name":"swapTokensForExactTokens","inputs":[{"name":"amountOut","type":"uint256","internalType":"uint256"},{"name":"amountInMax","type":"uint256","internalType":"uint256"},{"name":"path","type":"address[]","internalType":"address[]"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amounts","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"nonpayable"}]
export type UniswapRouterAbiFunctional = {"_": {"argumentSignature":{},"returnSignature":{},"stateMutability":"none","name":"none"},"WETH": {"name":"WETH", "stateMutability": "pure", "argumentSignature": {}, "returnSignature": {"0": string,}},"addLiquidity": {"name":"addLiquidity", "stateMutability": "nonpayable", "argumentSignature": {"tokenA": string,"tokenB": string,"amountADesired": (string | number),"amountBDesired": (string | number),"amountAMin": (string | number),"amountBMin": (string | number),"to": string,"deadline": (string | number),}, "returnSignature": {"amountA": (string | number),"amountB": (string | number),"liquidity": (string | number),}},"addLiquidityETH": {"name":"addLiquidityETH", "stateMutability": "payable", "argumentSignature": {"token": string,"amountTokenDesired": (string | number),"amountTokenMin": (string | number),"amountETHMin": (string | number),"to": string,"deadline": (string | number),}, "returnSignature": {"amountToken": (string | number),"amountETH": (string | number),"liquidity": (string | number),}},"factory": {"name":"factory", "stateMutability": "pure", "argumentSignature": {}, "returnSignature": {"0": string,}},"getAmountIn": {"name":"getAmountIn", "stateMutability": "pure", "argumentSignature": {"amountOut": (string | number),"reserveIn": (string | number),"reserveOut": (string | number),}, "returnSignature": {"amountIn": (string | number),}},"getAmountOut": {"name":"getAmountOut", "stateMutability": "pure", "argumentSignature": {"amountIn": (string | number),"reserveIn": (string | number),"reserveOut": (string | number),}, "returnSignature": {"amountOut": (string | number),}},"getAmountsIn": {"name":"getAmountsIn", "stateMutability": "view", "argumentSignature": {"amountOut": (string | number),"path": string[],}, "returnSignature": {"amounts": (string | number)[],}},"getAmountsOut": {"name":"getAmountsOut", "stateMutability": "view", "argumentSignature": {"amountIn": (string | number),"path": string[],}, "returnSignature": {"amounts": (string | number)[],}},"quote": {"name":"quote", "stateMutability": "pure", "argumentSignature": {"amountA": (string | number),"reserveA": (string | number),"reserveB": (string | number),}, "returnSignature": {"amountB": (string | number),}},"removeLiquidity": {"name":"removeLiquidity", "stateMutability": "nonpayable", "argumentSignature": {"tokenA": string,"tokenB": string,"liquidity": (string | number),"amountAMin": (string | number),"amountBMin": (string | number),"to": string,"deadline": (string | number),}, "returnSignature": {"amountA": (string | number),"amountB": (string | number),}},"removeLiquidityETH": {"name":"removeLiquidityETH", "stateMutability": "nonpayable", "argumentSignature": {"token": string,"liquidity": (string | number),"amountTokenMin": (string | number),"amountETHMin": (string | number),"to": string,"deadline": (string | number),}, "returnSignature": {"amountToken": (string | number),"amountETH": (string | number),}},"removeLiquidityETHSupportingFeeOnTransferTokens": {"name":"removeLiquidityETHSupportingFeeOnTransferTokens", "stateMutability": "nonpayable", "argumentSignature": {"token": string,"liquidity": (string | number),"amountTokenMin": (string | number),"amountETHMin": (string | number),"to": string,"deadline": (string | number),}, "returnSignature": {"amountETH": (string | number),}},"removeLiquidityETHWithPermit": {"name":"removeLiquidityETHWithPermit", "stateMutability": "nonpayable", "argumentSignature": {"token": string,"liquidity": (string | number),"amountTokenMin": (string | number),"amountETHMin": (string | number),"to": string,"deadline": (string | number),"approveMax": boolean,"v": (string | number),"r": (Uint8Array | string),"s": (Uint8Array | string),}, "returnSignature": {"amountToken": (string | number),"amountETH": (string | number),}},"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens": {"name":"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens", "stateMutability": "nonpayable", "argumentSignature": {"token": string,"liquidity": (string | number),"amountTokenMin": (string | number),"amountETHMin": (string | number),"to": string,"deadline": (string | number),"approveMax": boolean,"v": (string | number),"r": (Uint8Array | string),"s": (Uint8Array | string),}, "returnSignature": {"amountETH": (string | number),}},"removeLiquidityWithPermit": {"name":"removeLiquidityWithPermit", "stateMutability": "nonpayable", "argumentSignature": {"tokenA": string,"tokenB": string,"liquidity": (string | number),"amountAMin": (string | number),"amountBMin": (string | number),"to": string,"deadline": (string | number),"approveMax": boolean,"v": (string | number),"r": (Uint8Array | string),"s": (Uint8Array | string),}, "returnSignature": {"amountA": (string | number),"amountB": (string | number),}},"swapETHForExactTokens": {"name":"swapETHForExactTokens", "stateMutability": "payable", "argumentSignature": {"amountOut": (string | number),"path": string[],"to": string,"deadline": (string | number),}, "returnSignature": {"amounts": (string | number)[],}},"swapExactETHForTokens": {"name":"swapExactETHForTokens", "stateMutability": "payable", "argumentSignature": {"amountOutMin": (string | number),"path": string[],"to": string,"deadline": (string | number),}, "returnSignature": {"amounts": (string | number)[],}},"swapExactETHForTokensSupportingFeeOnTransferTokens": {"name":"swapExactETHForTokensSupportingFeeOnTransferTokens", "stateMutability": "payable", "argumentSignature": {"amountOutMin": (string | number),"path": string[],"to": string,"deadline": (string | number),}, "returnSignature": {}},"swapExactTokensForETH": {"name":"swapExactTokensForETH", "stateMutability": "nonpayable", "argumentSignature": {"amountIn": (string | number),"amountOutMin": (string | number),"path": string[],"to": string,"deadline": (string | number),}, "returnSignature": {"amounts": (string | number)[],}},"swapExactTokensForETHSupportingFeeOnTransferTokens": {"name":"swapExactTokensForETHSupportingFeeOnTransferTokens", "stateMutability": "nonpayable", "argumentSignature": {"amountIn": (string | number),"amountOutMin": (string | number),"path": string[],"to": string,"deadline": (string | number),}, "returnSignature": {}},"swapExactTokensForTokens": {"name":"swapExactTokensForTokens", "stateMutability": "nonpayable", "argumentSignature": {"amountIn": (string | number),"amountOutMin": (string | number),"path": string[],"to": string,"deadline": (string | number),}, "returnSignature": {"amounts": (string | number)[],}},"swapExactTokensForTokensSupportingFeeOnTransferTokens": {"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens", "stateMutability": "nonpayable", "argumentSignature": {"amountIn": (string | number),"amountOutMin": (string | number),"path": string[],"to": string,"deadline": (string | number),}, "returnSignature": {}},"swapTokensForExactETH": {"name":"swapTokensForExactETH", "stateMutability": "nonpayable", "argumentSignature": {"amountOut": (string | number),"amountInMax": (string | number),"path": string[],"to": string,"deadline": (string | number),}, "returnSignature": {"amounts": (string | number)[],}},"swapTokensForExactTokens": {"name":"swapTokensForExactTokens", "stateMutability": "nonpayable", "argumentSignature": {"amountOut": (string | number),"amountInMax": (string | number),"path": string[],"to": string,"deadline": (string | number),}, "returnSignature": {"amounts": (string | number)[],}}}